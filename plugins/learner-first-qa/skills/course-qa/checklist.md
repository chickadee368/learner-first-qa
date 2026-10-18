# Learner-First UX/LX Checklist

Created by [Chelsea Taylor](https://www.linkedin.com/in/chelseataylor) · Licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)

## Purpose

The purpose of this checklist is to measure the user and learner experience across digital learning content,
such as eLearning course exports and slide decks.

- **User Experience** is the extent to which a user, regardless of impairment, can understand and interact
  with the content.
- **Learner Experience** is the extent to which a learner, regardless of impairment, can achieve learning
  outcomes.

## Severity levels

The test for every level: **how does this impact the learner?** It keeps the focus on the learner and their experience, not on design or speed.

| # | Level | Definition | Example | Launch |
|---|---|---|---|---|
| 1 | **Blocked** | The learner can't access the content. | Video with no captions and no transcript; a lesson or page with no content | Must be fixed before launch |
| 2 | **Inaccurate** | The content is wrong, and a learner who follows it could make a mistake on the job. Wrong high-stakes content is always Inaccurate. | A wrong fee amount | Must be fixed before launch |
| 3 | **Detracts** | The learner gets less: less of the content, or a worse version of it than other learners get. | Transcript but no captions | Fix before launch, or launch with a named owner and a fix date |
| 4 | **Adds effort** | The learner gets the same content but has to work harder for it, which can hurt retention depending on subject, familiarity, distraction and pressure. | A misspelling that makes them re-read | Can launch; fix in the next revision |
| 5 | **Minor error** | Incorrect, but doesn't block understanding. Each one wears down the learner's trust in the content, and in the designer. | A missing comma; a wrong founding year | Can launch; fix in the next revision |

**High-stakes content** (wrong content here is always Inaccurate, in any module):
- Money: prices, fees, rates, amounts, billing steps
- Legal & compliance: regulations, policy, contract terms, how personal data is handled
- Safety & security: physical safety, health, passwords, access, identity checks and fraud
- Client-facing: anything the learner says, sends or shows to a customer
- Can't be undone: steps like approve, submit, delete, send

**Rules:**
- Each finding gets ONE level, the most severe that applies. Other levels it hits go in an **Also** column.
- Severity sets the suggested fix order. Within a level, findings with more Also entries sort first.
- The tool suggests the fix order; the reviewer and the designer can override it.
- Blocked and Detracts never move because content is high-stakes.
- Text that fails contrast (item 1) is **Detracts**: low-vision learners get a worse version of the same content.
  Text under 2:1 is **Blocked**: it is too faint to read at all.
- Missing required information (an amount, a step, a setting) is **Inaccurate** when following the course without it
  could lead to a mistake on the job. When the content is only less complete, it is **Detracts**.
- A large pile of Minor error findings can raise severity, but only rarely. No threshold set.



**Who checks:**
- **File:** the tool answers it from the course files.
- **Draft:** the tool drafts an answer, marked unconfirmed; a human confirms.
- **Human:** left open for a person.
- If the tool ever grades long-form answers, a person confirms the grade.


---

## Part 1 — User Experience (UX)

### Visual
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 1 | Contrast | Does the text pass the WebAIM contrast checker with a ratio of at least 4.5:1 for normal text and 3:1 for larger text? | File if colors are in the files, else Human | WebAIM Contrast Checker |
| 2 | Color as only indicator | Are there any instances where color is the only indication of meaning? | Draft | |
| 47 | Zoom | Does the content still work when zoomed to 200%, with nothing cut off, overlapping or hidden? | Human | W3C (2023), WCAG 1.4.4 |

### Images
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 3 | Alt text | Is there Alt Text for all images and tables? | File | WebAIM, Alternative Text |
| 4 | Decorative images | If the image is for aesthetics only, is it marked decorative? | File | WebAIM, Alternative Text |
| 40 | Decorative not clickable | Are decorative images non-interactive (not zoomable or clickable)? | File if the settings are in the export, else Human | |
| 43 | Branding | Does the content follow the organization's branding requirements, including any labels required on screenshots and images? | Human | |

### Structure and links
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 5 | Headings | Are heading styles and/or header rows used for text and tables? | File | WebAIM, Microsoft Word |
| 6 | Link text | Are hyperlinks descriptive? | File | WebAIM, Links and Hypertext |
| 7 | Free navigation | Can the learner freely navigate the content at their own pace? | Human | Pappas (2015) |
| 48 | Real lists | Are lists built as real lists, not typed dashes or symbols? | File | W3C (2023), WCAG 1.3.1 |

### Keyboard
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 44 | Keyboard access | Can every button, link and interaction be reached and used with the keyboard alone? | Human | W3C (2023), WCAG 2.1.1 |
| 45 | Visible focus | Can you always see where the keyboard focus is? | Human | W3C (2023), WCAG 2.4.7 |
| 46 | No keyboard traps | Can the learner always move the keyboard focus away from any element without getting stuck? | Human | W3C (2023), WCAG 2.1.2 |

### Audio and video
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 8 | Captions | Are there captions and/or transcripts provided for all audio? | File | WebAIM, Captions |
| 9 | Caption accuracy | If there are captions, do they align with the spoken audio? | File if there is a caption file and a transcript, else Human. Checking against the audio itself needs speech-to-text, which the tool doesn't do. | Arsic (2022) |
| 10 | Caption width | If there are captions, are they an appropriate width for the screen so that the learner isn't moving their head to read the caption? | Human | Arsic (2022) |

### Slides
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 11 | Slide reading order | If there are slides, is the reading order correct? | File | WebAIM, PowerPoint |
| 12 | Slide titles | If there are slides, are the slides titled? | File | |
| 13 | Slide layouts | If there are slides, is content aligned with slide layouts? | File | WebAIM, PowerPoint |
| 14 | Theme change | If there are slides, does the content make sense when the theme is changed? | Human | |

### Assistive technology
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 15 | Accessibility scanner | If there is an accessibility scanner built in to the program, do any issues appear? | Human | |
| 16 | Windows Narrator | Does the built-in Windows screenreader narrate the text as intended? | Human | Microsoft (2023) |
| 17 | Mac VoiceOver | Does the built-in Mac screenreader narrate the text as intended? | Human | Apple (2024) |

---

## Part 2 — Learner Experience (LX)

| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 18 | Outcomes shown | Are the learning outcomes displayed to the learner? | File | |
| 19a | Reading level | Is the reading level appropriate? | File | |
| 19b | Audience fit | Is the text easy to comprehend for this audience? | Draft if the intake describes the audience, else Human | |
| 20 | Terms defined | If there are uncommon terms, are they defined? | File | |

### Alignment
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 21 | Observable verbs | Does each learning objective use an observable verb? Can the objective actually be measured? | File | Bloom (1956) |
| 22a | Objective vs format | Does the level of each objective match what the format lets a learner demonstrate? | Draft | Bloom (1956) |
| 22b | Practice outside course | If the objectives need higher-level practice than the course can provide (analyze, evaluate, argue), does the learning plan place that practice outside the course (video, practice with a buddy)? | Human | Bloom (1956) |
| 23 | Content order | Does the order of the content build toward the objectives? | Draft | |
| 24 | Assessment level | Does the assessment test at the same level as the objective's verb? | File | Bloom (1956) |
| 25 | Proves knowledge | If a learner gets the answers right, can you strongly argue they know the topic? | Human | |

### Assessment quality
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 26 | Plausible distractors | Multiple choice: are all the wrong answers plausible, so the right answer isn't obvious among unrelated or random options? | File | |
| 27 | Requires recall | Does the assessment make the learner think back on the content, rather than being answerable without taking the course? | File | |
| 28 | Covered in course | Is everything the assessment asks about taught in this course, not in a team wiki or another outside source? *(N/A if the course has a prerequisite course.)* | File | |

### Practice and feedback
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 29 | Feedback given | Does every practice question give the learner feedback? | File | |
| 30 | Feedback explains why | Does the feedback explain *why* an answer is wrong, beyond "incorrect," "try again" or "not quite"? | File | |
| 31 | Feedback steers | Does the feedback address why a learner might have chosen that answer, and steer them toward the correct one, so they don't reach it by process of elimination? (A visual can help, like a picture showing where things are.) | File | |
| 32 | Leave and return | Can the learner leave the quiz to check the content and come back where they left off? Learners have their notes on the job, so the quiz shouldn't test memorization. | Human | |

### Relevance
| # | Short name | Criterion | Who checks | Reference |
|---|---|---|---|---|
| 33 | Learner language | Does the course use the language learners actually use on the job (acronyms, sales methodologies, team terms)? | Human | |
| 34 | Real processes | Does the content follow the existing processes and procedures the learner will use? | Human | |
| 35 | Tools explained | If the learner needs a specific software or tool, does the content explain it and the scenario they'd use it in? | File | |
| 36 | Real problems | Does the content include real problems the learner will face (case studies, scenario-based questions)? | File | |
| 37a | Links work | Do the links work? | File | |
| 37b | Outdated content | Is the information still current? (Tool flags dates, "as of" lines, version numbers, retired names, redirecting links.) | Draft | |
| 37c | Team repositories | Do links go to the repositories the team actually uses? | Human | |
| 38a | Connects within course | Does the content connect to earlier or later parts of this course? | Draft | |
| 38b | Connects to experience | Does the content connect to the learner's past experience or other courses? | Human | |
| 39 | Sign-off and beta | Has a manager signed off, and have team members beta tested the course? | Human | |
| 41 | Screenshots current | Do screenshots match the current product UI? | Human | |
| 42 | Product names | Are product names written with the company's exact capitalization (CamelCase, Sentence case, lowercase), not what a tool autocorrected them to? | File if product names are given in the intake field, else Draft (flags inconsistent spellings) | |

## References
- Apple. (2024). VoiceOver User Guide. https://support.apple.com/guide/voiceover/welcome/mac
- Arsic, K. M. (2022, July 30). The (Un)Written Closed Captioning Standards and Protocol. Subly. https://www.getsubly.com/post/captioning-standards-and-protocol
- Bloom, B. S. (Ed.). (1956). Taxonomy of educational objectives: The classification of educational goals. Handbook I: Cognitive domain. David McKay.
- Microsoft. (2023, October 9). How to turn on and use Narrator in Windows 11. https://www.microsoft.com/en-us/windows/learning-center/how-to-use-narrator
- Pappas, C. (2015, June 15). Effective eLearning Navigation: 5 Key Principles! eLearning Industry. https://elearningindustry.com/effective-elearning-navigation-5-key-principles
- WebAIM. (2024a). Alternative Text. https://webaim.org/techniques/alttext/
- WebAIM. (2024b). Captions, Transcripts, and Audio Descriptions. https://webaim.org/techniques/captions/
- WebAIM. (2024c). Contrast Checker. https://webaim.org/resources/contrastchecker/
- WebAIM. (2024d). Links and Hypertext. https://webaim.org/techniques/hypertext/
- WebAIM. (2024e). Microsoft Word. https://webaim.org/techniques/word/
- WebAIM. (2024f). PowerPoint Accessibility. https://webaim.org/techniques/powerpoint/#order
- W3C. (2023). Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/
