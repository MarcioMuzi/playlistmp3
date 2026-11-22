import pytest

from app import auth, converter
from app.errors import app_error

SESSION = (
    "# Netscape HTTP Cookie File\n"
    ".youtube.com\tTRUE\t/\tTRUE\t1999999999\tPREF\tf6=40000000\n"
    "#HttpOnly_.youtube.com\tTRUE\t/\tTRUE\t1999999999\t__Secure-3PSID\tvalor-secreto\n"
)
NO_SESSION = "# Netscape HTTP Cookie File\n.youtube.com\tTRUE\t/\tTRUE\t1999999999\tPREF\tf6=40000000\n"


def test_inspect_cookie_file(tmp_path):
    ok = tmp_path / "ok.txt"
    ok.write_text(SESSION)
    invalid = tmp_path / "invalid.txt"
    invalid.write_text(NO_SESSION)
    assert auth.inspect_cookie_file(ok) == "ok"
    assert auth.inspect_cookie_file(invalid) == "invalid"
    assert auth.inspect_cookie_file(tmp_path / "nao-existe.txt") == "missing"
    assert auth.inspect_cookie_file(tmp_path) == "unreadable"  # diretório


def test_other_domain_cookies_are_ignored(tmp_path):
    f = tmp_path / "c.txt"
    f.write_text(".example.com\tTRUE\t/\tTRUE\t1999999999\tSID\tx\n")
    assert auth.inspect_cookie_file(f) == "invalid"


@pytest.mark.parametrize(
    ("started", "mode", "can", "plan"),
    [
        (False, "fallback", False, [False, False, False]),
        (False, "off", True, [False, False, False]),
        (False, "fallback", True, [False, False, True, True]),
        (True, "fallback", True, [True, True]),
        (False, "always", True, [True, True]),
    ],
)
def test_attempt_plan(started, mode, can, plan):
    assert converter.attempt_plan(started, mode, can) == plan


def test_next_attempt():
    plan = [False, False, True, True]
    assert converter._next_attempt(plan, 0, "BLOCKED") == 1
    assert converter._next_attempt(plan, 0, "AGE_RESTRICTED") == 2  # pula a anônima restante
    assert converter._next_attempt(plan, 3, "BLOCKED") is None
    assert converter._next_attempt(plan, 0, "PRIVATE") is None
    assert converter._next_attempt([False, False, False], 0, "AGE_RESTRICTED") is None


INFO = {"id": "dQw4w9WgXcQ", "title": "t", "duration": 60, "_type": "video"}


@pytest.fixture
def fake_extract(monkeypatch):
    calls = []

    def install(results, available=True, mode="fallback"):
        it = iter(results)

        def _extract(video_id, use_auth):
            calls.append(use_auth)
            result = next(it)
            if isinstance(result, Exception):
                raise result
            return result

        converter.invalidate_info(INFO["id"])
        monkeypatch.setattr(converter, "_extract", _extract)
        monkeypatch.setattr(auth, "available", lambda: available)
        monkeypatch.setattr(auth, "mode", lambda: mode)
        return calls

    return install


def test_resolve_info_falls_back_to_auth_when_blocked(fake_extract):
    calls = fake_extract([app_error("BLOCKED"), INFO])
    info, used_auth = converter.resolve_info(INFO["id"])
    assert info is INFO and used_auth is True
    assert calls == [False, True]


def test_resolve_info_without_cookies_keeps_original_error(fake_extract):
    calls = fake_extract([app_error("AGE_RESTRICTED")], available=False)
    with pytest.raises(Exception) as exc:
        converter.resolve_info(INFO["id"])
    assert exc.value.code == "AGE_RESTRICTED"
    assert calls == [False]


def test_resolve_info_does_not_retry_unrelated_errors(fake_extract):
    calls = fake_extract([app_error("PRIVATE")])
    with pytest.raises(Exception) as exc:
        converter.resolve_info(INFO["id"])
    assert exc.value.code == "PRIVATE"
    assert calls == [False]


def test_resolve_info_always_mode_uses_auth_first(fake_extract):
    calls = fake_extract([INFO], mode="always")
    assert converter.resolve_info(INFO["id"]) == (INFO, True)
    assert calls == [True]


def test_cookie_copy_is_private_and_removed(tmp_path, monkeypatch):
    src = tmp_path / "secrets" / "youtube-cookies.txt"
    src.parent.mkdir()
    src.write_text(SESSION)
    monkeypatch.setattr(auth, "cookie_path", lambda: src)
    with auth.cookie_copy(tmp_path / "job") as copy_path:
        assert copy_path.read_text() == SESSION
        assert oct(copy_path.stat().st_mode & 0o777) == "0o600"
    assert not copy_path.exists()
    assert src.read_text() == SESSION  # original intacto
