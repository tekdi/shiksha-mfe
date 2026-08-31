"""Spelling checks over the prose we generate, and only over the prose we generate.

The mentors asked for a grammar and spelling gateway after the midpoint review.
Four decisions shape what this is, and each rules something out.

**It flags; it never rewrites.** A correction is a guess, and this module has no
way to tell a typo from a term it has not met. Silently editing generated text
would also make the output non-reproducible for the same input, which the
packaging tests rely on. Every issue carries a suggestion for a person to accept
or reject.

**It never looks at text taken from the source.** A glossary *term*, a transcript,
an evidence quote and a document title are the author's words, not ours. Marking
them would be telling a teacher their own textbook is misspelt, and "correcting"
one would break the grounding guarantee outright. Only text the model composed is
checked.

**It refuses to check a language it does not have a dictionary for.** The library
ships twelve, and no Indic language is among them. Running an English dictionary
over Hindi would flag every single word, so the check records itself as skipped
with the reason. A skipped check is not a passed check.

**It is optional.** The suite must keep running with no API key, no network and no
extra install, so the dependency lives in an extra. Without it the check is
skipped and says so.

The allow-list is what makes the whole thing usable. A lesson about the water
cycle legitimately contains "evapotranspiration", and a dictionary does not.
Every word already present in the source document is therefore accepted: if the
author wrote it, it is correct for this document by definition.
"""

from __future__ import annotations

import re
from functools import lru_cache

from .schema import ValidationIssue

VALIDATOR = "spelling"

#: Words are Unicode letter runs, allowing an internal apostrophe or hyphen so
#: "learner's" and "well-known" arrive whole rather than as fragments.
_WORD = re.compile(r"[^\W\d_]+(?:['’\-][^\W\d_]+)*", re.UNICODE)

#: Fragments a spell checker has no business reading. Stripped before tokenising
#: rather than filtered afterwards, so their inner words never become candidates.
_IGNORE = (
    re.compile(r"https?://\S+"),          # URLs
    # Each run excludes the delimiter that follows it, so there is nothing for
    # the engine to backtrack over: the naive \S+@\S+\.\S+ is quadratic on a
    # long token that turns out to have no "@" in it at all.
    re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+"),  # e-mail addresses
    re.compile(r"\$\$[^$]*\$\$"),          # display maths
    re.compile(r"\\\([^\\]*\\\)"),        # inline maths
    re.compile(r"\\[a-zA-Z]+"),           # stray LaTeX commands
    re.compile(r"`[^`]+`"),               # inline code
    re.compile(r"\[\[\d+\]\]"),           # our own fill-in-the-blank markers
)

#: Below this a "word" is almost always an initial, a unit or a stray letter, and
#: a dictionary has nothing useful to say about it.
_MIN_WORD = 3

#: Pieces that are legitimate inside a compound but are not words on their own, so
#: a dictionary rejects them: "multi-tenant" splits to "multi" + "tenant", and only
#: the second has an entry. Without this the checker flags the prefix of every
#: compound it meets, which is noise a reader learns to ignore — and a checker
#: whose output is ignored is worse than none, because it looks like coverage.
_COMPOUND_PARTS = frozenset(
    """
    anti auto bi bio co counter cross cyber de eco extra geo hyper inter intra macro
    micro mid mini mono multi neo non over post pre pro pseudo re self semi socio sub
    super trans tri ultra under uni
    based driven facing level like oriented ready related specific style type wide wise
    """.split()
)


def _strip_noise(text: str) -> str:
    for pattern in _IGNORE:
        text = pattern.sub(" ", text)
    return text


def words_in(text: str) -> list[str]:
    """The checkable words in a fragment of generated prose."""
    return [w for w in _WORD.findall(_strip_noise(text or "")) if len(w) >= _MIN_WORD]


def parts_of(word: str) -> list[str]:
    """Split a compound into the pieces a dictionary can actually answer for.

    English forms compounds freely and dictionaries do not list them, so checking
    "light-independent" as one token flags a perfectly good phrase from a biology
    lesson. Educational prose is full of these — "well-known", "self-contained",
    "multi-tenant" — and a checker that cried wolf at every one is a checker a
    teacher turns off. Judge the parts instead: the compound is a spelling problem
    only if a piece of it is.

    Splitting on the apostrophe handles the possessive for free: "learner's"
    becomes "learner" plus a one-letter fragment the length filter drops.
    """
    pieces = [p for p in re.split(r"['’\-]", word) if len(p) >= _MIN_WORD]
    # A lone word is never a compound part, so the prefix list only applies once
    # the word has actually been split: "post" written on its own is a real word
    # and should be checked like any other.
    if len(pieces) < 2:
        return pieces
    return [p for p in pieces if p.lower() not in _COMPOUND_PARTS]


#: British spellings, and the American form the dictionary actually carries.
#:
#: `pyspellchecker` ships one English dictionary and it is American, so "vapour",
#: "metres" and "organise" are all reported as misspellings. The tenants this engine
#: is built for teach in Indian English, which follows British spelling — so left
#: alone the check tells a teacher that their own correct spelling is wrong, which
#: is the fastest way to get a quality gate switched off.
#:
#: Longest suffix first, because "-ised" has to be tried before "-ise" or the wrong
#: half is replaced. Plurals and participles are listed explicitly rather than
#: stripped first: stripping is another guess, and this table is checkable by eye.
_BRITISH_TO_AMERICAN: tuple[tuple[str, str], ...] = (
    ("isations", "izations"), ("isation", "ization"),
    ("isables", "izables"), ("isable", "izable"),
    ("ising", "izing"), ("ised", "ized"), ("ises", "izes"), ("ise", "ize"),
    ("ysing", "yzing"), ("ysed", "yzed"), ("yses", "yzes"), ("yse", "yze"),
    ("res", "ers"), ("re", "er"),
    ("ences", "enses"), ("ence", "ense"),
    ("ogues", "ogs"), ("ogue", "og"),
    ("lling", "ling"), ("lled", "led"), ("ller", "ler"),
)
#: The `-our` family is deliberately absent above and handled by the infix table
#: below instead. Listing it in both places was the first version, and a mutation
#: proved the endings entries could be deleted without changing a single result —
#: the infix rule already produced the identical answer for every one of them. A
#: rule that cannot change an outcome cannot be known to be right.

#: The ones no suffix rule reaches.
_BRITISH_IRREGULARS: dict[str, str] = {
    "programme": "program", "programmes": "programs",
    "practise": "practice", "practised": "practiced", "practising": "practicing",
    "storey": "story", "storeys": "stories",
    "grey": "gray", "moustache": "mustache", "plough": "plow",
    "aluminium": "aluminum", "sulphur": "sulfur", "draught": "draft",
}


#: The same families, appearing inside a word rather than at its end. Tried only
#: after every ending rule has failed, and only on a word the dictionary already
#: rejected, so "journey" and "noise" never reach them.
_BRITISH_INFIXES: tuple[tuple[str, str], ...] = (
    ("our", "or"),
    ("isation", "ization"),
    ("ise", "ize"),
)


def american_spelling(word: str) -> str | None:
    """The American form of a British spelling, or None if no rule applies.

    Only ever consulted for a word the dictionary has already rejected, so a rule
    firing on an ordinary word costs nothing — "four" and "hour" never reach here.
    The residual risk is a genuine typo whose transformed form happens to be a real
    word, and that trade is deliberate: wrongly accepting a rare typo is a much
    smaller harm than wrongly telling a teacher that "vapour" is misspelt.
    """
    lowered = word.lower()
    if lowered in _BRITISH_IRREGULARS:
        return _BRITISH_IRREGULARS[lowered]
    for british, american in _BRITISH_TO_AMERICAN:
        if lowered.endswith(british) and len(lowered) > len(british):
            return lowered[: -len(british)] + american
    # The suffix rules only reach a word's ending, and several of these families run
    # through the middle — "favourite", "colourful", "organisational". Substituting
    # inside the word catches those; it is tried last so an ending rule always wins.
    for british, american in _BRITISH_INFIXES:
        if british in lowered:
            return lowered.replace(british, american, 1)
    return None


@lru_cache(maxsize=8)
def _checker(language: str):
    """A dictionary for `language`, or None if we do not have one.

    Membership is tested *before* constructing, deliberately. `SpellChecker`
    raises on an unknown language, so a tenant teaching in a language the library
    does not ship would turn a quality check into a 500.
    """
    try:
        from spellchecker import SpellChecker
    except ImportError:
        return None
    if language not in set(SpellChecker.languages()):
        return None
    return SpellChecker(language=language)


def supported_languages() -> set[str]:
    try:
        from spellchecker import SpellChecker
    except ImportError:
        return set()
    return set(SpellChecker.languages())


def _base_language(tag: str) -> str:
    """"en-GB" and "en_US" are both the English dictionary."""
    return re.split(r"[-_]", (tag or "en").strip().lower())[0]


class ProseChecker:
    """Checks generated prose against a dictionary plus the source's own vocabulary.

    Construct one per artefact: the allow-list is built from that artefact's
    source, and sharing it across documents would let one lesson's vocabulary
    silently excuse another's typos.
    """

    def __init__(self, language: str, source_text: str = "") -> None:
        self.language = _base_language(language)
        self._spell = _checker(self.language)
        self.available = self._spell is not None
        self.allowed: set[str] = set()
        if self.available and source_text:
            self.allow(source_text)

    @property
    def skip_reason(self) -> str | None:
        """Why this check will not run, phrased for a caller to pass on."""
        if self.available:
            return None
        if not supported_languages():
            return (
                "spelling: not checked, the optional spelling dependency is not installed "
                "(pip install 'lms-ai-engine[spelling]')"
            )
        return (
            f"spelling: not checked, no dictionary is available for language "
            f"{self.language!r} (have: {', '.join(sorted(supported_languages()))})"
        )

    def allow(self, *texts: str) -> None:
        """Accept every word appearing in `texts` as correct for this document.

        This is the difference between a check a teacher trusts and one they turn
        off. Subject vocabulary, place names, people, product names and acronyms
        are all absent from a general dictionary and all legitimately present in a
        lesson. The author already wrote them down; that is the evidence.
        """
        if not self.available:
            return
        fresh = {w.lower() for text in texts for w in words_in(text)} - self.allowed
        if fresh:
            self.allowed |= fresh
            self._spell.word_frequency.load_words(fresh)

    def _first_bad_piece(self, word: str) -> str | None:
        """The piece of `word` no dictionary knows, or None if it is fine.

        A compound is judged by its pieces: every piece known means the compound
        is fine even though no dictionary lists it. The piece is returned rather
        than the whole word so the suggestion is useful — correcting
        "light-independant" should offer "independent", not hunt for an entry for
        the whole phrase.
        """
        if word in self.allowed:
            return None
        pieces = [p for p in parts_of(word) if p not in self.allowed]
        if not pieces:
            return None
        unknown = self._spell.unknown(pieces)
        # An English dictionary that only knows American spellings would report every
        # British one as an error. Before flagging a piece, see whether it is simply
        # the British form of a word the dictionary does know.
        if unknown and self.language == "en":
            unknown = {p for p in unknown if not self._is_british_form(p)}
        return next((p for p in pieces if p in unknown), None)

    def _is_british_form(self, piece: str) -> bool:
        """True when `piece` is a British spelling of a word the dictionary carries."""
        american = american_spelling(piece)
        return bool(american) and american not in self._spell.unknown([american])

    def check(self, text: str, field_path: str) -> list[ValidationIssue]:
        """Flag the words in one generated fragment that no dictionary knows."""
        if not self.available or not text:
            return []
        seen: set[str] = set()
        issues: list[ValidationIssue] = []
        for word in words_in(text):
            lowered = word.lower()
            # A word wrong twice in one field is one problem to fix, not two.
            if lowered in seen:
                continue
            seen.add(lowered)
            bad = self._first_bad_piece(lowered)
            if bad is None:
                continue
            correction = self._spell.correction(bad)
            word = bad if bad != word.lower() else word
            issues.append(
                ValidationIssue(
                    code="spelling.unknown_word",
                    severity="warning",
                    field_path=field_path,
                    message=(
                        f"{word!r} is not in the {self.language} dictionary and does not appear "
                        "in the source document."
                        + (
                            f" Did you mean {correction!r}?"
                            if correction and correction != lowered
                            else ""
                        )
                    ),
                    actual=word,
                    suggestion=correction if correction and correction != lowered else None,
                    validator_name=VALIDATOR,
                )
            )
        return issues
