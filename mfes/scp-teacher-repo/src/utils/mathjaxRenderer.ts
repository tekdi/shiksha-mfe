import { mathjax } from 'mathjax-full/js/mathjax';
import { TeX } from 'mathjax-full/js/input/tex';
import { SVG } from 'mathjax-full/js/output/svg';
import { browserAdaptor } from 'mathjax-full/js/adaptors/browserAdaptor';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages';

// Register the HTML handler for the browser
if (typeof window !== 'undefined') {
  RegisterHTMLHandler(browserAdaptor());
}

const tex = new TeX({ packages: AllPackages });
const svg = new SVG();
const html = mathjax.document(typeof document !== 'undefined' ? document : ({} as any), {
  InputJax: tex,
  OutputJax: svg
});

/**
 * Typesets the mathematical content within a given element.
 */
export const typeset = async (element: HTMLElement) => {
  if (typeof window === 'undefined') return;
  
  try {
    // MathJax 3 processing
    html.findMath({ elements: [element] })
        .compile()
        .getMetrics()
        .typeset()
        .updateDocument();
  } catch (err) {
    console.error('MathJax typeset failed:', err);
  }
};
