okay add prisma for the database 
add these questions in the database,
also create a dummy participant and judges and admin profile,
also set the views like what pages are visible to each role 
{
  "easy_problems": [
    {
      "id": 1,
      "title": "Grade Calculator",
      "description": "Write a program that takes a numerical score (0-100) and prints the corresponding grade: 'A' (90-100), 'B' (80-89), 'C' (70-79), 'D' (60-69), 'F' (below 60). Check for invalid input (e.g., negative numbers, or numbers > 100).",
      "test_cases": [
        {
          "input": "85",
          "output": "Grade: B"
        },
        {
          "input": "102",
          "output": "Invalid input"
        }
      ]
    },
    {
      "id": 2,
      "title": "Number Sign",
      "description": "Take a number as input and determine if it is positive, negative, or zero. Print the result accordingly.",
      "test_cases": [
        {
          "input": "5",
          "output": "Positive"
        },
        {
          "input": "0",
          "output": "Zero"
        },
        {
          "input": "-13",
          "output": "Negative"
        }
      ]
    },
    {
      "id": 3,
      "title": "Weekday/Weekend Check",
      "description": "Given a number from 1 to 7 representing the day of the week, determine if it is a 'Weekday' (1-5) or 'Weekend' (6-7). Use an else block to handle invalid numbers.",
      "test_cases": [
        {
          "input": "3",
          "output": "Weekday"
        },
        {
          "input": "7",
          "output": "Weekend"
        },
        {
          "input": "9",
          "output": "Invalid input"
        }
      ]
    },
    {
      "id": 4,
      "title": "Discount Calculator",
      "description": "A store offers discounts based on the purchase amount. Calculate the final price. Over $1000: 20% discount. Over $500 (up to $1000): 10% discount. $500 or less: No discount. Formula: Final Price = Amount - (Amount * Discount%)",
      "test_cases": [
        {
          "input": "Amount = 1200",
          "output": "Final Price: $960.0"
        },
        {
          "input": "Amount = 800",
          "output": "Final Price: $720.0"
        },
        {
          "input": "Amount = 300",
          "output": "Final Price: $300.0"
        }
      ]
    },
    {
      "id": 5,
      "title": "Character Type",
      "description": "Write a program to determine if a character is an 'Uppercase letter', 'Lowercase letter', 'Digit', or 'Other character' (e.g., symbol).",
      "test_cases": [
        {
          "input": "'A'",
          "output": "Uppercase letter"
        },
        {
          "input": "'z'",
          "output": "Lowercase letter"
        },
        {
          "input": "'5'",
          "output": "Digit"
        },
        {
          "input": "'@'",
          "output": "Other character"
        }
      ]
    },
    {
      "id": 6,
      "title": "Leap Year Check",
      "description": "Determine if a year is a leap year. Rules: divisible by 4, but not by 100 unless also divisible by 400.",
      "test_cases": [
        {
          "input": "2020",
          "output": "Leap year"
        },
        {
          "input": "1900",
          "output": "Not a leap year"
        },
        {
          "input": "2000",
          "output": "Leap year"
        }
      ]
    },
    {
      "id": 7,
      "title": "Traffic Light Logic",
      "description": "Simulate a traffic light. Input can be 'red' -> 'Stop', 'yellow' -> 'Slow down', 'green' -> 'Go'. Use an else block for invalid colors.",
      "test_cases": [
        {
          "input": "green",
          "output": "Go"
        },
        {
          "input": "red",
          "output": "Stop"
        },
        {
          "input": "blue",
          "output": "Invalid color"
        }
      ]
    },
    {
      "id": 8,
      "title": "Vowel or Consonant",
      "description": "Input a single letter. Determine if it is a Vowel (a, e, i, o, u) or a Consonant. Handle both uppercase and lowercase letters. Handle invalid characters.",
      "test_cases": [
        {
          "input": "'a'",
          "output": "Vowel"
        },
        {
          "input": "'Z'",
          "output": "Consonant"
        },
        {
          "input": "'1'",
          "output": "Invalid character"
        }
      ]
    },
    {
      "id": 9,
      "title": "BMI Calculator",
      "description": "Calculate BMI (Body Mass Index) and categorize it. Formula: BMI = weight (kg) / (height (m) * height (m)). Categories: BMI < 18.5 -> Underweight, 18.5 <= BMI < 25 -> Normal weight, 25 <= BMI < 30 -> Overweight, BMI >= 30 -> Obese.",
      "test_cases": [
        {
          "input": {
            "weight": 60,
            "height": 1.7
          },
          "output": "Normal weight"
        },
        {
          "input": {
            "weight": 95,
            "height": 1.65
          },
          "output": "Obese"
        }
      ]
    },
    {
      "id": 10,
      "title": "Number Comparison",
      "description": "Input three numbers and determine the largest.",
      "test_cases": [
        {
          "input": "5, 10, 3",
          "output": "Largest number: 10"
        },
        {
          "input": "15, 15, 12",
          "output": "Largest number: 15"
        }
      ]
    }
  ],
  "for_loop_problems": [
    {
      "id": 1,
      "title": "Sum of a Range",
      "description": "Write a program that takes two numbers—start and end—and calculates the sum of all integers in that range (inclusive) using a for loop.",
      "test_cases": [
        {
          "input": "Start: 1, End: 5",
          "output": "The sum is: 15"
        },
        {
          "input": "Start: 10, End: 15",
          "output": "The sum is: 75"
        }
      ]
    },
    {
      "id": 2,
      "title": "Factorial Calculator",
      "description": "Take a non-negative integer as input and use a for loop to calculate its factorial. Formula: n! = n × (n−1) × (n−2) × ... × 1",
      "test_cases": [
        {
          "input": "5",
          "output": "The factorial of 5 is: 120"
        },
        {
          "input": "0",
          "output": "The factorial of 0 is: 1"
        }
      ]
    },
    {
      "id": 3,
      "title": "Multiplication Table",
      "description": "Ask the user for a number. Use a for loop to print the multiplication table for that number from 1 to 10.",
      "test_cases": [
        {
          "input": "8",
          "output": "8 x 1 = 8\n8 x 2 = 16\n8 x 3 = 24\n...\n8 x 10 = 80"
        },
        {
          "input": "3",
          "output": "3 x 1 = 3\n3 x 2 = 6\n...\n3 x 10 = 30"
        }
      ]
    },
    {
      "id": 4,
      "title": "Fibonacci Sequence",
      "description": "Print the first n numbers of the Fibonacci sequence. The Fibonacci sequence starts with 0 and 1, and each number is the sum of the two preceding ones.",
      "test_cases": [
        {
          "input": "8",
          "output": "0, 1, 1, 2, 3, 5, 8, 13"
        },
        {
          "input": "5",
          "output": "0, 1, 1, 2, 3"
        }
      ]
    },
    {
      "id": 6,
      "title": "Prime Number Check",
      "description": "Take a number as input and use a for loop to determine if it's a prime number. A prime number is greater than 1 and divisible only by 1 and itself.",
      "test_cases": [
        {
          "input": "13",
          "output": "13 is a prime number."
        },
        {
          "input": "10",
          "output": "10 is not a prime number."
        }
      ]
    },
    {
      "id": 7,
      "title": "Sum of Digits",
      "description": "Take an integer as input and use a for loop to calculate the sum of its digits.",
      "test_cases": [
        {
          "input": "1234",
          "output": "The sum of digits is: 10"
        },
        {
          "input": "506",
          "output": "The sum of digits is: 11"
        }
      ]
    },
    {
      "id": 8,
      "title": "Pattern Printing (Right Triangle)",
      "description": "Take a number n as input and print a right-angled triangle of asterisks (*) with n rows using nested for loops.",
      "test_cases": [
        {
          "input": "4",
          "output": "*\n**\n***\n****"
        },
        {
          "input": "2",
          "output": "*\n**"
        }
      ]
    }
  ],
  "problem_solving_challenges": [
    {
      "id": 1,
      "title": "String Reversal",
      "description": "Given a string, reverse the order of its characters and return the new string.",
      "concepts": [
        "String manipulation",
        "for loop"
      ],
      "input_format": "A single line containing a string.",
      "output_format": "The reversed string.",
      "test_cases": [
        {
          "input": "hello",
          "output": "olleh"
        },
        {
          "input": "coding",
          "output": "gnidoc"
        }
      ]
    },
    {
      "id": 2,
      "title": "Sum of Array Elements",
      "description": "Given a string of space-separated integers, convert it into an array, calculate the sum of all elements, and return the sum.",
      "concepts": [
        "String-to-array conversion",
        "data conversion",
        "for loop"
      ],
      "input_format": "A single line containing space-separated integers.",
      "output_format": "A single integer representing the sum.",
      "test_cases": [
        {
          "input": "1 2 3 4 5",
          "output": "15"
        },
        {
          "input": "10 20 30",
          "output": "60"
        }
      ]
    },
    {
      "id": 3,
      "title": "Check for Palindrome",
      "description": "Determine if the given string is a palindrome (reads the same forwards and backwards).",
      "concepts": [
        "String manipulation",
        "while loop",
        "conditionals"
      ],
      "input_format": "A single line containing a string of lowercase characters.",
      "output_format": "A boolean value (true or false).",
      "test_cases": [
        {
          "input": "racecar",
          "output": "true"
        },
        {
          "input": "hello",
          "output": "false"
        }
      ]
    },
    {
      "id": 4,
      "title": "Count Vowels",
      "description": "Count the number of vowels (a, e, i, o, u) in the given string (case-insensitive).",
      "concepts": [
        "String manipulation",
        "for loop",
        "conditionals"
      ],
      "input_format": "A single line containing a string.",
      "output_format": "A single integer representing the vowel count.",
      "test_cases": [
        {
          "input": "Programming",
          "output": "3"
        },
        {
          "input": "AEIOU",
          "output": "5"
        }
      ]
    },
    {
      "id": 5,
      "title": "Find Min and Max",
      "description": "Find the minimum and maximum values in an array of integers and return them as a string.",
      "concepts": [
        "Array manipulation",
        "for loop"
      ],
      "input_format": "A single line of space-separated integers.",
      "output_format": "A single string in the format 'min max'.",
      "test_cases": [
        {
          "input": "8 1 5 9 2",
          "output": "1 9"
        },
        {
          "input": "10 -2 -5",
          "output": "-5 10"
        }
      ]
    },
    {
      "id": 6,
      "title": "String to Title Case",
      "description": "Convert the input sentence to title case — capitalize the first letter of each word, lowercase the rest.",
      "concepts": [
        "String manipulation",
        "for loop",
        "data conversion"
      ],
      "input_format": "A single line containing a sentence.",
      "output_format": "The sentence in title case.",
      "test_cases": [
        {
          "input": "hello world",
          "output": "Hello World"
        },
        {
          "input": "this is a test",
          "output": "This Is A Test"
        }
      ]
    },
    {
      "id": 7,
      "title": "First Non-Repeating Character",
      "description": "Find the first character in a string that does not repeat. If all characters repeat, return an empty string.",
      "concepts": [
        "String manipulation",
        "for loop",
        "hash map (or object/dictionary)"
      ],
      "input_format": "A single line containing a string.",
      "output_format": "A single character or an empty string.",
      "test_cases": [
        {
          "input": "stress",
          "output": "t"
        },
        {
          "input": "aabbcc",
          "output": ""
        }
      ]
    },
    {
      "id": 8,
      "title": "Array Product",
      "description": "Calculate the product of all integers in the array.",
      "concepts": [
        "Array traversal",
        "for loop"
      ],
      "input_format": "A single line containing space-separated integers.",
      "output_format": "A single integer representing the product.",
      "test_cases": [
        {
          "input": "2 3 4",
          "output": "24"
        },
        {
          "input": "1 -5 2",
          "output": "-10"
        }
      ]
    },
    {
      "id": 9,
      "title": "Check for Prime Number",
      "description": "Determine if the given positive integer is a prime number.",
      "concepts": [
        "for loop",
        "conditionals"
      ],
      "input_format": "A single positive integer.",
      "output_format": "A boolean value (true or false).",
      "test_cases": [
        {
          "input": "7",
          "output": "true"
        },
        {
          "input": "8",
          "output": "false"
        }
      ]
    },
    {
      "id": 10,
      "title": "FizzBuzz",
      "description": "Print numbers from 1 to a given limit. For multiples of 3, print 'Fizz'. For multiples of 5, print 'Buzz'. For multiples of both, print 'FizzBuzz'.",
      "concepts": [
        "for loop",
        "conditionals",
        "basic math"
      ],
      "input_format": "A single integer (upper limit).",
      "output_format": "Print each result on a new line.",
      "test_cases": [
        {
          "input": "5",
          "output": "1\n2\nFizz\n4\nBuzz"
        },
        {
          "input": "15",
          "output": "1\n2\nFizz\n4\nBuzz\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz"
        }
      ]
    }
  ]
}



context 
i want to build this project for a hackathon 
## Purpose and scope
- Build an offline coding-contest platform for a single batch event called CodeStorm, running on one LAN host PC and accessible from lab PCs via that host’s IP; no internet, no cloud dependencies [1].  
- Audience roles: Participant, Judge, Admin; each role sees dedicated views and actions; judges work concurrently; admin controls contest, content, and exports [1].  

## Core constraints
- Offline-only, one LAN host; all assets local; SQLite database via Prisma; WebSocket-based realtime for statuses, leaderboard, and timers [1][3].  
- Authentication uses pre-printed credentials; per-PC access code and IP logging on first login; security is lightweight, usability-focused [1].  

## Information architecture
- Top-level routes: Login, Home, Problems, Problem Detail, My Submissions, Judge Queue, Judge Review, Leaderboard (Big Screen), Admin Dashboard, Admin Problems, Admin Users, Admin Exports, Contest Control, Audit Log [1].  
- Global header shows role, username (except in judge anonymized views), and remaining contest time for participants; footer shows version/build and LAN host IP hint [1].  

## Roles and permissions
- Participant: view problems, submit code, see statuses, view leaderboard; cannot see names in leaderboard rows (only usernames) [1].  
- Judge: see anonymized pending queue, review latest attempt per problem per user, Accept/Reject, revise verdicts; cannot view participant identity in judge views [1].  
- Admin: all judge capabilities + manage problems/users, start/stop contest, configure points/difficulties, view stats and audit log, export CSVs, backup/restore DB [1].  

## Contest lifecycle
- States: Setup, Reading (15 min), Running (60 min), Locked (no submissions), Results (read-only) [1].  
- Admin manually transitions from Setup → Reading → Running → Locked; website timer is server-authoritative; participant pages reflect time left; no automatic start [1].  

## Scoring logic
- Problem difficulties: Easy 0.5, Medium 1, Hard 5 (editable in admin), binary verdicts only; no negatives; only latest submission per user per problem counts [1].  
- Leaderboard ordering: by confirmed points desc, then least total time (sum of acceptance timestamps offsets from contest start), breaking ties deterministically [2].  

## Realtime behavior
- Use WebSockets to push: submission-created (Pending), verdict-changed (Accepted/Rejected), leaderboard-updated, timer-changed, and content-changed (if problems updated) [1].  
- Leaderboard shows both Confirmed points and Pending points; a visible drop can occur when pending is rejected for dramatic effect [2].  

## Authentication and session rules
- Login with username/password from printed slips; upon first login, capture and store IP and per-PC access code if required; log audit entry; keep session cookie simple [1].  
- Auto-logout at contest end with “time over” warning; allow re-login during the contest without losing client UI state; inactivity logout optional [1].  

## Anti-cheating posture
- PCs offline; UI disables right-click and DevTools prompts but not kiosk mode; plagiarism checks are not included by design; audit log tracks critical actions [1].  

## Participant experience
- Home/Dashboard: shows contest phase, global timer, quick links to Problems, My Submissions, and Leaderboard; shows “reading mode” banner if applicable [1].  
- Problems list: 20–25 problems with difficulty chips (Easy/Medium/Hard), points badges, search/filter; list items show status badges per user: Not started, In progress (draft in client), Pending, Accepted, Rejected [1].  
- Problem detail:
  - Sections: Statement (Markdown + LaTeX), Constraints, Sample Input/Output (code blocks), Difficulty and Points, Hidden judge notes not visible to participant [1].  
  - Submission panel: language selector (OOP choices: C++, Java, Python, Other), large paste area, keyboard shortcuts, paste-detection warning, submit confirmation modal [1].  
  - After submit: status flips to Pending with timestamp; participants may resubmit; only the latest attempt counts when judged; prior attempts retained in history panel [1].  
- My Submissions page: table of attempts with problem, language, attempt count, status, timestamps; clicking an item opens read-only code view and verdict history [1].  
- Leaderboard link: opens read-only live board; identity is usernames only; no department filters since one batch only [2].  

## Judge experience
- Judge queue: anonymized cards sorted by oldest pending; filters by Problem and Language; search by problem title; batch count shown; realtime updates add new cards live [1].  
- Review page/modal for a submission:
  - Header: Problem title, language, attempt number, created-at, last-update [1].  
  - Code viewer: monospaced, copy button; no participant identity; optional notes area for internal comments [1].  
  - Actions: Accept or Reject; confirmation modal; optional note; changing verdict updates score events and recalculates leaderboard immediately [1].  
  - Attempt history sidebar: shows prior attempts on this problem by the same anonymized user with timestamps and verdicts; judges can navigate across attempts [1].  
- Concurrency: multiple judges can work in parallel; last write wins on a submission; UI prevents double marking with optimistic lock and toasts [1].  

## Admin experience
- Contest Control:
  - Set contest times; buttons for “Start Reading”, “Start Contest”, “Lock Submissions”, “Show Results”; timers broadcast via WebSocket to all clients [1].  
  - Toggle to momentarily hide/show pending points on the big screen; emergency “Pause” (soft lock) for unforeseen issues [2].  
- Admin Dashboard:
  - KPIs: total users, problems, submissions; acceptance rate; submissions-per-5-min chart; time-to-first-accept metrics [1].  
  - Recent activity feed from Audit Log (logins, submissions, verdicts, edits) [1].  
- Problems management:
  - Create/Edit problems with fields: title, difficulty, points, Statement (Markdown + LaTeX), Constraints, Sample I/O, Hidden judge notes [1].  
  - Bulk JSON import/export to swap the entire set fast if questions leak; version history with revert; changes broadcast as “content-changed” [1].  
- Users management:
  - Bulk CSV/JSON import for participants; auto-generate passwords; print-friendly roster view; optional per-PC access code assignment [1].  
  - Role assignment (Admin/Judge/Participant); identity masking for judges enforced by role [1].  
- Exports:
  - CSV: submissions (with problem/difficulty/points/status/timestamps), final standings (username, points, time), users list; one-click download [1].  
- Audit log:
  - Paginated list with filters by action type (LOGIN, SUBMIT, VERDICT, EDIT_PROBLEM, EXPORT, CONTROL); includes actor, entity, IP, timestamp, details [1].  
- Backup/Restore:
  - Button to trigger SQLite snapshot to a chosen folder/USB; status showing last backup time; restore flow tested pre-event [3].  

## Leaderboard (big screen)
- Retro 8‑bit theme using local NES.css styling; full-screen mode; auto-fit to projector resolution; dark theme by default; minimal chrome [4][2].  
- Rows display: position, username, confirmed points, pending points in a dual bar, and time metric; updates push-driven without reload; stable row animations [2].  
- Sorting: confirmed points desc, then least total time; pending points shown in parentheses and in the bar visualization; togglable pending visibility [2].  

## Data model and rules
- Entities: User, Role (enum), Problem, Submission, Verdict (enum), Session (contest participation timing), ScoreEvent (created on Accept only), LeaderboardSnapshot (optional), AuditLog, Seat (PC/IP map) [1].  
- Submission rules: last submission per problem per user is the one judged/considered; judges can change verdicts; system recalculates score and leaderboard on each change [1].  
- Time calculation: total time is sum over Accepted submissions of (acceptedAt − contestStart) in milliseconds; stored or calculated on the fly; displayed as mm:ss on UI [2].  

## Realtime events catalogue
- submission.created: {submissionId, problemId, userId, timestamp} → updates participant status, judge queue, leaderboard pending points [1].  
- verdict.updated: {submissionId, verdict, points, acceptedAt} → updates participant status, judge queue removal, confirmed score, leaderboard order [1].  
- contest.timer: {phase, serverNow, startAt, endAt} → updates timers on all pages [1].  
- content.changed: {problemId? or “bulk”} → participants’ problem list refresh [1].  

## Navigation and UX patterns
- Left nav for authenticated areas with icons; keyboard-first forms; confirmation modals on final submit and final verdict; toast notifications for actions [1].  
- Participant split-view option: Statement on left, submission area on right; autosave client-side drafts; clear “latest submission replaces previous” note [1].  
- Judge batch processing: after marking a submission, auto-advance to next pending; sticky filters; anonymous IDs; copy code buttons [1].  

## Content formatting
- Statement supports Markdown with fenced code blocks and LaTeX; client renders offline with pre-bundled libs; sample I/O shown in monospace blocks [3].  
- Difficulty colors: Easy (green), Medium (amber), Hard (red); badges consistent across list, detail, and judge views [1].  

## Offline and deployment details
- One host machine runs the server; bind to 0.0.0.0 and share host IP; clients open http://HOST_IP:3000; WebSockets on same origin; no external calls [1].  
- SQLite file lives alongside app; backups rotate every N minutes to a directory and optional USB; WAL mode recommended; restore procedure documented [3].  

## Safety and resilience
- Guard rails: rate-limit per user per problem to prevent accidental spam (soft); optimistic UI with server confirmation; clear error states if DB locked [1].  
- Admin “soft lock” lets organizers pause submissions without ending contest; hard lock triggers at T+60 or on manual “Lock” [1].  

## Deliverables checklist for generator
- Pages and routes for every view listed; role-based access guards; anonymization in judge surfaces; server-side time authority [1].  
- Prisma schema implementing all entities; migrations; seed script for roles, a few problems, and demo users [3].  
- WebSocket event bus and client hooks; leaderboard push updates; pending and confirmed point visualization [1].  
- Admin content editor with JSON import/export; CSV export endpoints; audit logging middleware on key actions [1].  
- Retro leaderboard theme using local CSS; shadcn UI components locally stored; dark/light toggles; print-friendly login slips [4].  

## Acceptance criteria
- Entire app runs offline on LAN; all features work without internet; pages load under 1s on lab PCs; judge actions reflect in leaderboard within 1s [1].  
- Multiple judges can mark concurrently without conflicts; last write wins with clear toasts; verdict changes recalc leaderboard immediately [1].  
- Backups produced on schedule; CSV exports open correctly in spreadsheet tools; audit log captures all actions with timestamps and IPs [1].  
