# Lesson presentation guide

How a lesson section should read, so a learner can follow it top to bottom without the video. Modelled on the index
lesson (`src/data/lessons/index.ts`, part 1) and on the presentation style of sydexa.com's SQL course.

## Order inside a section

1. **Bridge** (first intro line): one sentence linking to what the learner already knows.
   "Ta đã biết X. Nhưng còn Y?"
2. **Problem first**: the situation or pain, with concrete data, before the concept that solves it.
3. **Concept**: one idea per paragraph. Define each term the first time it appears, or link a glossary
   key with `{{key|text}}`. An everyday analogy helps when the idea is abstract.
4. **Lists**: when a paragraph enumerates 3 or more parallel items, write each item as its own line
   starting with `- `. The page renders consecutive `- ` lines as one bullet list. Start each item with
   the bold keyword: `- **Leaf**: ...`.
5. **`predict`** (before a widget or compare): one question that makes the learner commit to a guess,
   rendered as "Dự đoán trước khi xem". The explanation is shown after they answer. It does not count
   toward progress. Use it only when the widget answers the question.
6. **Widget / compare / board**: the interactive part. Its lead-in line tells the learner what to try:
   "Chọn ..., rồi bấm ...".
7. **`after`**: what the widget just showed, and the "why".
8. **`takeaway`**: 1 to 3 lines to remember, rendered as a blue callout. Default title "Điều rút ra".
   Use `title: "Chuỗi nhân quả cần nhớ"` for an A → B → C chain.
9. **`trap`**, then **`quiz`**: the quiz only asks what the section taught.

## Writing rules

- Vietnamese, no em dashes.
- Never claim "Đã chạy" / "Đã đo" for something that was not run.
- Keep section, part and quiz ids stable; saved progress is keyed by them.
- Prose supports `code`, **bold**, `{{glossary}}` and `- ` bullet lines only.
