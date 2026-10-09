Study Flow

Team Member
- Nang Nu Nu Aye
- Lin Lin Wai
- Yamin Thwe

Project Description
This is a study planner website that helps students organize their courses, notes, tasks and study time in one place.

This includes:
- Sign up and log in (Student and Admin roles)
- Add, edit and delete courses with class schedules
- Block courses whose class times clash on the same day
- Write and organize notes for each course
- Create, edit and delete tasks with due dates and status
- Pomodoro timer that saves study sessions
- Dashboard with study analytics
- Admin dashboard to manage users

#Screenshot
#Login Page
<img width="1458" height="804" alt="Screenshot 2026-10-09 at 10 35 59 PM" src="https://github.com/user-attachments/assets/9cfc0bce-28df-4e3e-9630-cd7f8f235792" />

#Dashboard
<img width="1470" height="956" alt="Screenshot 2026-10-09 at 10 41 51 PM" src="https://github.com/user-attachments/assets/42759a22-60c0-434e-9b4c-728bb4cae3b6" />

#Admin Dashboard
<img width="1470" height="956" alt="Screenshot 2026-10-09 at 10 44 31 PM" src="https://github.com/user-attachments/assets/963b5dbb-72d0-4aad-90d9-a078fcf97c72" />

# Basic Usage Instruction
# Install project
- Clone the project
- `cd backend` then `npm install`
- Copy `.env.example` to `.env.local` and fill in MONGODB_URI, JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD
- `cd frontend` then `npm install`

# Start website
- In backend: `npm run dev` (localhost:3000)
- In frontend: `npm run dev`
- Open the local URL (localhost:5173)

# Create admin account
- In backend: `npm run seed:admin`
- Log in with the admin email and password from `.env.local`

# Add course
- Click Courses, then + Add Course
- Enter the course name and code
- Add class times (day, start time, end time)
- Click Save. If the time clashes with another course, an error message appears.

# Manage notes and tasks
- Click Notes to add, edit or delete notes for a course
- Click Tasks to add a task, set a due date and change its status
- Use Edit to change a note or task, and Delete to remove it

# Pomodoro timer
- Click Pomodoro, choose a course and click Start
- When the session ends, it is saved as study time

# Dashboard
Click Dashboard to view:
- Total study time
- Tasks to do and done
- Upcoming and overdue tasks

# Admin
Log in as admin to view:
- Total users, students and admins
- User table with search and role filter
- Change role, deactivate or delete users

# Data Storage
All data is stored in a MongoDB Atlas database, so it stays saved after refreshing or logging in on another computer.
Passwords are hashed with bcrypt, and logins use JWT tokens.


