import * as fflate from 'fflate';
import { packageAndDownload } from './zipUtils';
import { QuizOutput, MCQQuestion, FITBQuestion, MatchQuestion } from './AIContentTypes';

/**
 * Builds a SCORM 1.2 package and triggers download.
 */
export async function downloadSCORM(
  generatedOutputs: Record<string, any>,
  title: string = "AI Generated Assessment"
): Promise<void> {
  const quiz = generatedOutputs['quiz'] as QuizOutput;
  if (!quiz) throw new Error("No quiz content to pack");

  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="shiksha-ai-assessment" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org">
    <organization identifier="org">
      <title>${title}</title>
      <item identifier="item1" identifierref="resource1">
        <title>${title}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="resource1" type="webcontent" 
              adlcp:scormtype="sco" href="index.html">
      <file href="index.html"/>
      <file href="scorm-api.js"/>
    </resource>
  </resources>
</manifest>`;

  const scormApi = `// This shim communicates with the LMS's SCORM API
var API = null;
function findAPI(win) {
  var attempts = 0;
  while (!win.API && win.parent && win.parent !== win && attempts < 10) {
    win = win.parent; attempts++;
  }
  return win.API || null;
}
function initSCORM() {
  API = findAPI(window);
  if (API) API.LMSInitialize('');
}
function finishSCORM(score, maxScore) {
  if (!API) return;
  API.LMSSetValue('cmi.core.score.raw', String(score));
  API.LMSSetValue('cmi.core.score.max', String(maxScore));
  API.LMSSetValue('cmi.core.lesson_status', score >= maxScore * 0.5 ? 'passed' : 'failed');
  API.LMSCommit('');
  API.LMSFinish('');
}`;

  const indexHtml = generateIndexHtml(generatedOutputs, title);

  const zipData: fflate.Zippable = {
    'imsmanifest.xml': fflate.strToU8(manifest),
    'scorm-api.js': fflate.strToU8(scormApi),
    'index.html': fflate.strToU8(indexHtml)
  };

  return packageAndDownload(zipData, 'ai-assessment-scorm.zip');
}

function generateIndexHtml(generatedOutputs: Record<string, any>, title: string): string {
  const quiz = generatedOutputs['quiz'] as QuizOutput;
  const takeaways = (generatedOutputs['key_takeaways'] as any)?.takeaways || [];
  const glossary = (generatedOutputs['glossary'] as any)?.terms || [];
  
  const quizData = JSON.stringify(quiz);
  
  return `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
    <script src="scorm-api.js"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; background-color: #f5f7fa; color: #333; }
        .card { background: white; padding: 25px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 20px; }
        h1, h2 { color: #1a73e8; }
        .section-title { border-bottom: 2px solid #1a73e8; padding-bottom: 10px; margin-top: 40px; }
        .question { font-weight: 600; font-size: 1.1em; margin-bottom: 15px; }
        .options { list-style: none; padding: 0; }
        .option { padding: 10px 15px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; cursor: pointer; transition: all 0.2s; }
        .option:hover { background-color: #f0f7ff; border-color: #1a73e8; }
        .option.selected { background-color: #1a73e8; color: white; border-color: #1a73e8; }
        .btn { background-color: #1a73e8; color: white; border: none; padding: 12px 25px; border-radius: 8px; font-size: 1em; cursor: pointer; margin-top: 20px; }
        .btn:disabled { background-color: #ccc; }
        #results { display: none; text-align: center; }
        .blank-input { border: none; border-bottom: 2px solid #1a73e8; outline: none; padding: 2px 5px; font-size: inherit; width: 100px; text-align: center; }
        .takeaway-item { margin-bottom: 20px; border-left: 4px solid #1a73e8; padding-left: 15px; }
        .glossary-item { margin-bottom: 15px; }
        .glossary-term { font-weight: bold; color: #1a73e8; }
    </style>
</head>
<body onload="initSCORM()">
    <div id="content-container">
        <h1>${title}</h1>

        ${takeaways.length > 0 ? `
        <div id="takeaways-section">
            <h2 class="section-title">Key Takeaways</h2>
            <div class="card">
                ${takeaways.map((t: any) => `
                    <div class="takeaway-item">
                        <strong>${t.title}</strong>
                        <p>${t.summary}</p>
                    </div>
                `).join('')}
            </div>
            <button class="btn" onclick="startQuiz()">Proceed to Assessment</button>
        </div>
        ` : ''}

        <div id="quiz-section" style="${takeaways.length > 0 ? 'display:none' : ''}">
            <h2 class="section-title">Assessment</h2>
            <div id="questions-list"></div>
            <button id="submit-btn" class="btn" onclick="submitQuiz()">Submit Assessment</button>
        </div>

        ${glossary.length > 0 ? `
        <div id="glossary-section" style="display:none">
            <h2 class="section-title">Glossary</h2>
            <div class="card">
                ${glossary.map((g: any) => `
                    <div class="glossary-item">
                        <span class="glossary-term">${g.term}:</span> ${g.definition}
                    </div>
                `).join('')}
            </div>
            <button class="btn" onclick="window.close()">Close Lesson</button>
        </div>
        ` : ''}

        <div id="results" class="card">
            <h2>Assessment Complete</h2>
            <p id="score-text"></p>
            ${glossary.length > 0 ? '<button class="btn" onclick="showGlossary()">View Glossary</button>' : ''}
        </div>
    </div>

    <script>
        const quiz = ${quizData};
        const userAnswers = {};

        function startQuiz() {
            const takeaways = document.getElementById('takeaways-section');
            if (takeaways) takeaways.style.display = 'none';
            document.getElementById('quiz-section').style.display = 'block';
        }

        function showGlossary() {
            document.getElementById('results').style.display = 'none';
            const glossary = document.getElementById('glossary-section');
            if (glossary) glossary.style.display = 'block';
        }

        function renderQuiz() {
            const list = document.getElementById('questions-list');
            if (!quiz || !quiz.questions) return;
            
            quiz.questions.forEach((q, idx) => {
                const card = document.createElement('div');
                card.className = 'card';
                
                let content = '<div class="question">' + (idx + 1) + '. ' + (q.question || q.instruction || 'Question') + '</div>';
                
                if (quiz.questionType === 'mcq') {
                    content += '<div class="options">';
                    q.answers.forEach((ans, aIdx) => {
                        content += '<div class="option" onclick="selectOption(' + idx + ', ' + aIdx + ', this)">' + ans.text + '</div>';
                    });
                    content += '</div>';
                } else if (quiz.questionType === 'fill_in_the_blanks') {
                    let sentence = q.sentence.replace(/\\*([^\\*]+)\\*/g, (match, word) => {
                        return '<input type="text" class="blank-input" onchange="answerBlank(' + idx + ', this)">';
                    });
                    content += '<p>' + sentence + '</p>';
                } else if (quiz.questionType === 'match_the_pair') {
                    content += '<p>Match the following pairs:</p>';
                    q.pairs.forEach((pair, pIdx) => {
                        content += '<div style="display:flex; align-items:center; margin-bottom:10px;">' +
                                   '<span style="flex:1">' + pair.left + '</span>' +
                                   '<span style="margin:0 10px">→</span>' +
                                   '<input type="text" class="blank-input" placeholder="Match..." onchange="answerMatch(' + idx + ', ' + pIdx + ', this)">' +
                                   '</div>';
                    });
                }
                
                card.innerHTML = content;
                list.appendChild(card);
            });
        }

        function selectOption(qIdx, aIdx, el) {
            const options = el.parentElement.getElementsByClassName('option');
            for (let opt of options) opt.classList.remove('selected');
            el.classList.add('selected');
            userAnswers[qIdx] = aIdx;
        }

        function answerBlank(qIdx, el) {
            if (!userAnswers[qIdx]) userAnswers[qIdx] = [];
            const inputs = el.parentElement.getElementsByTagName('input');
            userAnswers[qIdx] = Array.from(inputs).map(i => i.value);
        }

        function answerMatch(qIdx, pIdx, el) {
            if (!userAnswers[qIdx]) userAnswers[qIdx] = {};
            userAnswers[qIdx][pIdx] = el.value;
        }

        function submitQuiz() {
            let score = 0;
            let maxScore = quiz.questions.length;

            quiz.questions.forEach((q, idx) => {
                if (quiz.questionType === 'mcq') {
                    if (userAnswers[idx] !== undefined && q.answers[userAnswers[idx]].correct) {
                        score++;
                    }
                } else if (quiz.questionType === 'fill_in_the_blanks') {
                    const answers = userAnswers[idx] || [];
                    const correctAnswers = q.sentence.match(/\\*([^\\*]+)\\*/g).map(m => m.replace(/\\*/g, ''));
                    let qScore = 0;
                    correctAnswers.forEach((ca, i) => {
                        if (answers[i] && answers[i].toLowerCase().trim() === ca.toLowerCase().trim()) qScore++;
                    });
                    if (qScore === correctAnswers.length) score++;
                } else if (quiz.questionType === 'match_the_pair') {
                    const answers = userAnswers[idx] || {};
                    let qScore = 0;
                    q.pairs.forEach((pair, i) => {
                        if (answers[i] && answers[i].toLowerCase().trim() === pair.right.toLowerCase().trim()) qScore++;
                    });
                    if (qScore === q.pairs.length) score++;
                }
            });

            document.getElementById('quiz-section').style.display = 'none';
            document.getElementById('results').style.display = 'block';
            document.getElementById('score-text').innerText = 'You scored ' + score + ' out of ' + maxScore;
            
            finishSCORM(score, maxScore);
        }

        renderQuiz();
    </script>
</body>
</html>`;
}

