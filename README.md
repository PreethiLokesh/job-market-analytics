# JobMarket Analytics & Job Recommender

A full-stack web app for exploring the job market. Search and apply for jobs, view analytics on in-demand skills, salaries and hiring trends, and get job recommendations based on your skills.

**Tech stack:** React (Vite) · Spring Boot · MongoDB · JWT authentication

## Features

- Sign up and log in securely (JWT, hashed passwords) with user and admin roles
- Search jobs by keyword, city and skill, then apply and track your applications
- Analytics dashboard: top skills, salary by role or city, hiring trend, top companies
- Skill-based recommender that ranks jobs by match score and shows missing skills
- Admin panel to manage jobs and view users

## Requirements

- JDK 17+
- Maven
- Node.js 20+
- MongoDB running on `localhost:27017`

## Run Locally

```bash
# Backend (first start generates 50,000 sample jobs, takes about a minute)
cd backend
mvn spring-boot:run

# Frontend (in a new terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and create an account.
API docs (Swagger): http://localhost:8080/swagger-ui.html

## Configuration

Backend settings are in `backend/src/main/resources/application.properties`: MongoDB URI, JWT secret, allowed frontend origin, and number of sample jobs.

The default JWT secret is a placeholder. Use your own long, random secret if you deploy this.

## REST API

All endpoints are under `/api`. Everything except signup and login needs a JWT in the `Authorization: Bearer <token>` header.

| Endpoint | Access | Purpose |
|---|---|---|
| `POST /api/auth/signup`, `POST /api/auth/login` | Public | Register and log in, returns a JWT |
| `GET /api/me`, `PUT /api/me` | User | View and update profile (name, city, skills) |
| `GET /api/jobs?q=&city=&skill=&page=&size=` | User | Search, filter and paginate jobs |
| `GET /api/jobs/{id}` | User | Job details |
| `POST /api/jobs/{id}/apply` | User | Apply to a job |
| `GET /api/me/applications` | User | Application history |
| `POST /api/recommend` | User | Ranked jobs for the given skills and city |
| `GET /api/me/recommendations` | User | Recommendations based on profile skills |
| `GET /api/analytics/overview` | User | Job counts and average salary |
| `GET /api/analytics/top-skills` | User | Most in-demand skills |
| `GET /api/analytics/salary?by=role\|city` | User | Average salary by role or city |
| `GET /api/analytics/hiring-trend` | User | Jobs posted per month |
| `GET /api/analytics/top-companies` | User | Top hiring companies |
| `GET /api/meta` | User | Cities, roles and skills for dropdowns |
| `POST /api/admin/jobs`, `DELETE /api/admin/jobs/{id}` | Admin | Add and delete jobs |
| `GET /api/admin/users` | Admin | List users |

Full interactive docs are available in Swagger at http://localhost:8080/swagger-ui.html.

## How the Recommender Works

A single MongoDB aggregation finds jobs that share skills with the user, scores each one (matched skills ÷ required skills × 100), and sorts by score and salary.

## Using Real Data (Optional)

The app generates sample jobs on first start. To use real job postings instead, import a CSV such as Kaggle's LinkedIn Job Postings (2023 - 2024) `postings.csv` with the script in `tools/`:

```bash
pip install -r tools/requirements.txt
python tools/import_kaggle.py path/to/postings.csv --dry-run   # preview only, writes nothing
python tools/import_kaggle.py path/to/postings.csv             # replace the sample data
```

Restart the backend afterwards. Use `--append` to keep the existing data, or `--help` to see all options. The dataset itself is not included in this repo.

