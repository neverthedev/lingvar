# LingVar Application - Customer Requirements

> **Уточнение требований от 2026-09-12:** согласованная основная модель описана в
> [«Модель обучения: правила, прогресс и повторение»](docs/LEARNING_MODEL.md).
> Этот документ имеет приоритет в вопросах иерархии правил, оценки их частей,
> подбора упражнений и ближайшей аудитории — небольшой группы учеников.
> Перечни из четырёх уроков/упражнений, численные цели роста и очередность ниже
> остаются исходным черновиком для пересмотра при планировании разработки.

## What I Want to Build

I want to create an online language learning platform that helps Russian-speaking students learn Polish. The application should be accessible through a web browser and provide an interactive, engaging way to practice Polish grammar and vocabulary.

---

## Main Purpose

The platform should help students:
- Learn Polish grammar rules, especially how words change in different situations (called "cases")
- Practice vocabulary through interactive exercises
- Track their progress over time
- Get better at the words they struggle with through smart repetition

---

## Core Features I Need

### 1. User Accounts

**What I want:**
- Students should be able to create their own accounts with a username, email, and password
- Students should be able to log in and log out securely
- Each student should have their own personal learning space where we track their progress
- Students who aren't logged in shouldn't be able to access the learning materials

**Why it's important:**
- This allows us to save each student's progress individually
- Students can come back anytime and continue where they left off
- We can personalize the learning experience for each student

---

### 2. Vocabulary Library

**What I want:**
- A large database of Polish words including:
  - **Nouns** (like "book", "table", "person") with all their different forms
  - **Pronouns** (like "I", "you", "he", "she") with all their different forms
  - **Verbs** (like "to be", "to go", "to have") with all their conjugations
  - **Numbers** with their Polish and Russian translations

**For each noun, I need:**
- The basic word
- All 7 forms in singular (when there's just one)
- All 7 forms in plural (when there's more than one)
- Special masculine forms where applicable

**Why it's important:**
- Students need variety - they shouldn't see the same words every time
- Having many words makes the learning experience richer
- Words should be organized so we can easily find and use them in exercises

---

### 3. Learning Lessons

**What I want:**
Four types of structured lessons:

**Lesson 1: Singular Nouns (Beginner Level, 15 minutes)**
- Students learn how single nouns change in different situations
- Examples and explanations for each form
- Simple exercises to practice

**Lesson 2: Plural Nouns (Beginner Level, 20 minutes)**
- Students learn how plural nouns work
- Rules and exceptions
- Practice exercises

**Lesson 3: Pronouns (Beginner Level, 20 minutes)**
- Students learn different types of pronouns
- How pronouns change depending on their role in a sentence
- Practice exercises

**Lesson 4: Verbs (Intermediate Level, 25 minutes)**
- Students learn how verbs change with different subjects (I, you, he/she, we, they)
- Practice with common verbs
- More challenging exercises

**Each lesson should have:**
- Clear explanations
- Visual examples
- A way to track how far the student has progressed
- A nice, clean design that's easy to read

---

### 4. Practice Exercises

**What I want:**
Four types of interactive exercises that students can practice repeatedly:

**Exercise 1: Genitive Case - Singular**
- Students practice the genitive case (used for "of" or "from") with single nouns
- 15 minutes per session
- The system shows random words each time
- Students fill in the correct forms

**Exercise 2: Genitive Case - Plural**
- Same as above but with plural nouns
- 15 minutes per session

**Exercise 3: Nominative Plural**
- Students practice the basic plural form
- 10 minutes per session
- Focus on common patterns and exceptions

**Exercise 4: Numbers**
- Students practice Polish numbers with Russian translations
- 10 minutes per session
- Helps with counting and number recognition

**How exercises should work:**
1. Student picks an exercise
2. System shows 20 random words
3. Student fills in the answers
4. System immediately tells them if they're right or wrong
5. At the end, student sees their score
6. System remembers which words the student struggled with

---

### 5. Progress Tracking & Smart Learning

**What I want:**
- The system should remember every answer each student gives
- Track which words they get right and which they get wrong
- Count how many times they've tried each word
- Calculate their accuracy (right answers / total attempts)

**Smart Repetition:**
- Words the student gets wrong should appear more often in future exercises
- Words the student has mastered should appear less often
- The system should automatically adjust this based on their performance
- Students should be able to see their improvement over time

**Why it's important:**
- Students learn faster when they focus on words they struggle with
- Seeing progress motivates students to keep learning
- No time wasted on words they already know well

---

### 6. Content Management (For Me/Administrators)

**What I want:**
A special admin area where I can:
- Add new words to the database
- Edit existing words if we find mistakes
- Delete words that aren't useful
- Search for specific words quickly
- Filter words by type or properties
- Import many words at once from a file (not one by one)

**Why it's important:**
- I need to keep the content accurate and up-to-date
- As we grow, we'll want to add more vocabulary
- If students report errors, I need to fix them quickly
- Importing in bulk saves time when adding hundreds of words

---

### 7. Grammar Reference Section

**What I want:**
- A place where students can read grammar rules and explanations
- Rules should be organized by topic
- Some rules should have sub-rules (like chapters and sub-chapters in a book)
- Rules should be numbered or ordered so students can work through them logically

**For example:**
- Main topic: "Noun Cases"
  - Sub-rule: "Nominative Case - when to use"
  - Sub-rule: "Genitive Case - when to use"
  - Sub-rule: "Dative Case - when to use"
  - And so on...

**Why it's important:**
- Students need to understand the "why" behind the rules
- They should be able to reference rules while doing exercises
- Good explanations make learning easier and faster

---

### 8. Welcome & Dashboard

**What I want:**
**For visitors (not logged in):**
- A beautiful homepage explaining what the platform does
- Clear buttons to "Get Started" (sign up) or "Sign In"
- Simple, welcoming design that makes people want to try it

**For logged-in students:**
- Personalized welcome message with their name
- Quick overview of their account information
- Easy access buttons to jump into lessons or exercises
- Their membership start date
- Their account status

**Why it's important:**
- First impressions matter - the homepage should excite visitors
- Returning students should feel welcomed and quickly get to learning
- Clear navigation helps students find what they need

---

## Important Requirements

### Easy to Use
- Everything should be simple and intuitive
- Students shouldn't need instructions to figure out how to use it
- Clear labels on all buttons
- Obvious navigation

### Fast and Reliable
- Pages should load quickly
- Exercises should respond immediately when students submit answers
- No crashes or errors that interrupt learning
- Work smoothly even with many students using it at the same time

### Looks Professional
- Clean, modern design
- Consistent colors and styling throughout
- Works on computers, tablets, and phones
- Easy to read text and comfortable spacing

### Secure
- Student passwords must be protected
- Only logged-in students can access lessons and exercises
- Each student can only see their own progress
- Admin features only accessible to me

### Accessible Anywhere
- Students should be able to use it from home, school, library, anywhere
- Works on all modern web browsers (Chrome, Firefox, Safari, Edge)
- Doesn't require any special software to install

---

## What Success Looks Like

After you build this, I should be able to:
1. Add 1,000+ Polish words into the system
2. Have students create accounts and start learning immediately
3. See students practicing regularly and improving their scores
4. Easily update content when needed
5. Have the system automatically help students focus on their weak areas
6. Scale to support hundreds of students without issues

---

## Future Ideas (Not for First Version)

These are things I'd like to add later:
- Audio pronunciations for each word
- Student progress charts and statistics
- Achievement badges to motivate students
- Ability for students to create custom practice sets
- Mobile apps for iOS and Android
- Social features where students can challenge friends
- More language pairs beyond Polish-Russian
- Flashcard mode for quick reviews
- Offline mode so students can practice without internet

---

## Priority

**Must Have (First Version):**
- User accounts (registration, login, logout)
- Vocabulary database with at least 500 words
- All 4 lesson types working
- All 4 exercise types working
- Basic progress tracking
- Admin panel for me to manage content

**Should Have (Soon After):**
- Smart repetition system fully working
- Student progress dashboard
- Grammar reference section
- Better mobile phone support

**Nice to Have (Later):**
- Audio pronunciations
- Advanced statistics
- Achievement system
- Export reports

---

## Questions You Might Have

**Q: How many students will use this?**
A: Initially 50-100 students, but I want it to grow to 1,000+ students over the next year.

**Q: What languages should the interface be in?**
A: The interface text should be in Russian since that's what the students speak. The vocabulary being taught is Polish.

**Q: How will you get the Polish vocabulary data?**
A: I already have some data collected, and I'll continue adding more manually through the admin panel.

**Q: Do you need any payment system?**
A: Not in the first version. Later I might want to charge for premium features, but let's keep it simple initially.

**Q: Should students be able to reset their progress?**
A: Yes, that would be nice to have in the user profile settings.

**Q: What about teacher accounts to monitor student progress?**
A: Great idea! Not needed immediately, but let's plan for it in the future.

---

## Summary

I want a web-based Polish learning platform where Russian-speaking students can:
- Create accounts and log in securely
- Access structured lessons on Polish grammar
- Practice with interactive exercises
- Have the system track their progress and automatically focus on their weak areas
- See their improvement over time

And where I (the admin) can:
- Manage the vocabulary database
- Add, edit, and delete content
- Keep the platform running smoothly

The key is making it simple, effective, and motivating for students who want to learn Polish.

---

*This is what I envision. I trust you'll use the right technologies and best practices to build it properly. Please let me know if you need any clarification on what I'm looking for!*
