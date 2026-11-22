import pytest

from app.errors import classify_ytdlp_error
from app.main import safe_filename


@pytest.mark.parametrize(
    ("message", "code"),
    [
        ("ERROR: [youtube] abc: Private video. Sign in if you've been granted access", "PRIVATE"),
        ("ERROR: [youtube] abc: Sign in to confirm your age. This video may be inappropriate for some users.", "AGE_RESTRICTED"),
        ("ERROR: [youtube] abc: Sign in to confirm you're not a bot.", "BLOCKED"),
        ("ERROR: unable to download video data: HTTP Error 403: Forbidden", "BLOCKED"),
        ("ERROR: [youtube] abc: Video unavailable. This video has been removed by the uploader", "UNAVAILABLE"),
        ("ERROR: [youtube] abc: Join this channel to get access to members-only content", "MEMBERS_ONLY"),
        ("ERROR: [youtube] abc: This live event will begin in 3 hours.", "LIVE"),
        ("ERROR: Unable to download webpage: <urlopen error [Errno -3] Temporary failure in name resolution>", "NETWORK"),
        ("ERROR: something completely different", "UNKNOWN"),
    ],
)
def test_classify(message, code):
    assert classify_ytdlp_error(message) == code


def test_safe_filename():
    assert safe_filename('AC/DC: "Back in Black" <Live>?') == "AC DC Back in Black Live.mp3"
    assert safe_filename("") == "audio.mp3"
    assert safe_filename("...") == "audio.mp3"
    assert len(safe_filename("a" * 500)) == 154
