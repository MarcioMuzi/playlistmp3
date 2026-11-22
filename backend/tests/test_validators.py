import pytest

from app.validators import canonical_url, extract_video_id

VID = "dQw4w9WgXcQ"


@pytest.mark.parametrize(
    "url",
    [
        f"https://www.youtube.com/watch?v={VID}",
        f"https://youtube.com/watch?v={VID}&t=42s",
        f"http://m.youtube.com/watch?feature=share&v={VID}",
        f"https://music.youtube.com/watch?v={VID}&list=RDAMVM",
        f"youtube.com/watch?v={VID}",
        f"https://youtu.be/{VID}",
        f"https://youtu.be/{VID}?si=abc123",
        f"youtu.be/{VID}",
        f"https://www.youtube.com/shorts/{VID}",
        f"https://youtube.com/shorts/{VID}?feature=share",
        f"  https://www.youtube.com/watch?v={VID}  ",
    ],
)
def test_accepts_valid_youtube_urls(url):
    assert extract_video_id(url) == VID


@pytest.mark.parametrize(
    "url",
    [
        "",
        "   ",
        "not a url",
        "https://vimeo.com/123456",
        "https://www.youtube.com/playlist?list=PL123",
        "https://www.youtube.com/@canal",
        "https://www.youtube.com/watch?v=short",
        f"https://www.youtube.com/embed/{VID}",
        f"https://evil-youtube.com/watch?v={VID}",
        f"https://youtube.com.evil.com/watch?v={VID}",
        f"ftp://youtube.com/watch?v={VID}",
        f"javascript:alert(1)//youtube.com/watch?v={VID}",
        f"https://www.youtube.com/watch?v={VID}x",
        "https://youtu.be/",
    ],
)
def test_rejects_invalid_urls(url):
    assert extract_video_id(url) is None


def test_canonical_url():
    assert canonical_url(VID) == f"https://www.youtube.com/watch?v={VID}"
