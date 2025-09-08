Based on all our discussions and the details you've provided for your CodeStorm project, here is a complete and detailed prompt for the Gemini CLI to generate the backend. This prompt includes the database schema, API endpoints, real-time functionality, and the business logic required for your offline hackathon contest platform.

---

### **Comprehensive Gemini CLI Prompt for CodeStorm Backend**

I need to create a complete, offline-first web application backend for a coding contest called **CodeStorm**. The application will run on a single LAN host and serve clients from a local IP address. I have already set up the frontend, so my focus is on generating a robust backend using Node.js.

**Here is the full plan:**

1.  **Project Setup**: Generate a backend application using Node.js and an appropriate framework (e.g., Express.js) that can serve both a REST API and a WebSocket server. The entire application must be self-contained and have no external dependencies, as it will operate in a LAN-only, offline environment.

2.  **Database with Prisma**:
    * Use **Prisma** as the ORM to manage a local **SQLite** database.
    * Generate a `schema.prisma` file with the following models and enums, ensuring all relationships are correctly defined:
        * `User`: `id`, `username`, `password`, `role`.
        * `Role`: An enum with values `ADMIN`, `JUDGE`, `PARTICIPANT`.
        * `Problem`: `id`, `title`, `description`, `difficulty` (string), `points` (float), `test_cases` (JSON), `hidden_judge_notes` (string).
        * `Submission`: `id`, `problemId`, `userId`, `language`, `code`, `status` (`Verdict` enum), `attemptCount` (int), `timestamps` (created at, updated at).
        * `Verdict`: An enum with values `ACCEPTED`, `REJECTED`, `PENDING`.
        * `ScoreEvent`: `id`, `submissionId`, `points` (float), `acceptedAt` (datetime).
        * `AuditLog`: `id`, `actor`, `action` (e.g., `LOGIN`, `SUBMIT`), `entity` (e.g., user ID, problem ID), `ip` (string), `timestamp` (datetime), `details` (JSON).
        * `Seat`: `id`, `pcAccessCode`, `ipAddress`, `userId`, `timestamps`.
    * **Seed the database** with a Prisma seed script (`seed.ts`):
        * Create **dummy profiles**:
            * Admin: `username: admin`, `password: admin123`, `role: ADMIN`.
            * Judge: `username: judge`, `password: judge123`, `role: JUDGE`.
            * Participant: `username: participant`, `password: participant123`, `role: PARTICIPANT`.
        * Populate the `Problem` table using the provided JSON data. Assign `difficulty` and `points` based on the categories:
            * "easy_problems": `difficulty: "Easy"`, `points: 0.5`.
            * "for_loop_problems": `difficulty: "Medium"`, `points: 1.0`.
            * "problem_solving_challenges": `difficulty: "Hard"`, `points: 5.0`.

3.  **Authentication & APIs**:
    * Create a REST API for user login and session management using JWT or simple session cookies.
    * Implement middleware to protect all routes based on the user's `Role`.
    * **Participant APIs**: `POST /api/submissions`, `GET /api/problems`, `GET /api/problems/:id`, `GET /api/mysubmissions`.
    * **Judge APIs**: `GET /api/judge/queue` (anonymized), `POST /api/judge/verdict`, `GET /api/judge/submission/:id`.
    * **Admin APIs**: `GET /api/admin/dashboard`, `POST /api/admin/problems`, `GET /api/admin/users`, `POST /api/admin/users`, `POST /api/admin/contest`, `GET /api/admin/exports`, `GET /api/admin/audit-log`.
    * **Public APIs**: `GET /api/leaderboard` (publicly accessible).

4.  **Real-time Features (WebSockets)**:
    * Implement a **WebSocket server** to push real-time updates to connected clients.
    * The server must broadcast the following events:
        * `submission.created`: Updates participant status and adds to judge queue.
        * `verdict.updated`: Updates participant status and triggers a leaderboard recalculation.
        * `contest.timer`: Broadcasts the current contest phase and remaining time.
        * `content.changed`: Notifies clients when problems are updated by an admin.

5.  **Business Logic**:
    * **Submission Logic**: Store all submissions. The judging and scoring logic should only consider the latest submission per problem per user.
    * **Scoring Logic**: On an `ACCEPTED` verdict, create a `ScoreEvent` and immediately recalculate the leaderboard. A user's total time is the sum of the time differences between the contest start and the `acceptedAt` timestamp for each of their accepted submissions.
    * **Contest Control**: The admin can manually transition the contest state. The server's timer is the single source of truth for all clients.
    * **Audit Logging**: Implement a middleware or service to automatically log key actions to the `AuditLog` table, including the user, action, timestamp, and IP address.

6.  **Page Visibility and Routing (Frontend)**:
    * While the frontend is already built, the backend must enforce the following routing rules based on the user's `Role` to ensure security:
        * **Public/Guest**: Can access `/`, `/login`, `/leaderboard`, and `/404` pages.
        * **Participant**: Can access all public pages plus `/dashboard`, `/problems`, `/problems/:id`, and `/mysubmissions`.
        * **Judge**: Can access all public pages plus `/judge/queue`, `/judge/review/:submissionId`, and `/problems`.
        * **Admin**: Has access to all pages and all backend routes, including their exclusive admin pages: `/admin/dashboard`, `/admin/problems`, `/admin/users`, `/admin/exports`, `/admin/contest-control`, and `/admin/audit-log`.

problem statements 
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