from zipfile import ZipFile
from app.models.schemas import Chapter
from app.packaging.multimedia_packages import build_h5p_interactive_video

def test_interactive_video_package(tmp_path):
    path = build_h5p_interactive_video('Video','captions.vtt',[Chapter(title='Intro', start=0)],tmp_path/'video.h5p')
    with ZipFile(path) as z:
        assert {'h5p.json','content/content.json'} <= set(z.namelist())
