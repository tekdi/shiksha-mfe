from zipfile import ZipFile
from pathlib import Path
from app.models.schemas import Question, QuestionType, SourceEvidence, Branding
from app.packaging.assessment_packages import build_h5p_question_set, build_scorm_assessment
from app.packaging.lesson_packages import build_html_lesson, build_h5p_course_presentation, build_scorm_lesson

def q(kind=QuestionType.mcq):
    return Question(type=kind,prompt='What?',options=['A','B'],answer='A',pairs=[('left','right')] if kind == QuestionType.match_pair else [],explanation='Because',evidence=SourceEvidence(quote='Because'))

def test_assessment_packages_have_required_files(tmp_path):
    h5p = build_h5p_question_set('Quiz',[q(), q(QuestionType.fill_blank), q(QuestionType.match_pair)],tmp_path/'quiz.h5p')
    scorm = build_scorm_assessment('Quiz',[q()],tmp_path/'quiz.zip')
    with ZipFile(h5p) as z: assert {'h5p.json','content/content.json'} <= set(z.namelist())
    with ZipFile(scorm) as z: assert {'imsmanifest.xml','index.html'} <= set(z.namelist())

def test_lesson_packages_have_required_files(tmp_path):
    html = build_html_lesson('Lesson',['One','Two'],Branding(),tmp_path/'lesson.html')
    h5p = build_h5p_course_presentation('Lesson',['One'],tmp_path/'lesson.h5p')
    scorm = build_scorm_lesson('Lesson',html.read_text(),tmp_path/'lesson.zip')
    assert html.exists()
    with ZipFile(h5p) as z: assert 'h5p.json' in z.namelist()
    with ZipFile(scorm) as z: assert 'imsmanifest.xml' in z.namelist()
