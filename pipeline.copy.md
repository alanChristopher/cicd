# Name of the workflow (shows in GitHub Actions UI)
name: Express API CI/CD

# 👇 Defines WHEN this pipeline should run
on:
    # Trigger on push to main branch
    push:
        branches: [ "main" ]

    # Trigger on ANY pull request (you can restrict branches if needed)
    pull_request:

# 👇 Jobs are independent units of work (run in parallel unless linked)
jobs:

    # ========================
    # 1. CI JOB (Testing Phase)
    # ========================
    ci:
        # Runs on a fresh Ubuntu VM provided by GitHub
        runs-on: ubuntu-latest

        # 👇 Spin up dependent services (like DB) inside CI
        services:
            postgres:
                image: postgres:15  # Docker image for PostgreSQL

                # Environment variables inside the container
                env:
                    POSTGRES_USER: postgres
                    POSTGRES_PASSWORD: postgres
                    POSTGRES_DB: cicd

                # Expose container port → host machine
                ports:
                    - 5432:5432

                # 👇 Health check (VERY IMPORTANT in real pipelines)
                options: >-
                    --health-cmd="pg_isready" 
                    --health-interval=10s
                    --health-timeouts=5s 
                    --health-retries=5

        # 👇 Environment variables for your Node app
        env:
            DATABASE_URL: postgresql://postgres:postgres@localhost:5432/cicd

        # 👇 Steps = sequential commands executed in this job
        steps:
            # Step 1: Clone your repo into the runner
            - name: Checkout
              uses: actions/checkout@v4

            # Step 2: Install Node.js
            - name: Setup Node
              uses: actions/setup-node@v4
              with:
                  node-version: 20   # Node version
                  cache: npm         # Enables dependency caching (faster builds)

            # Step 3: Install dependencies
            - name: Install Deps
              run: npm install

            # Step 4: Generate Prisma client
            - name: Prisma Generate
              run: npx prisma generate

            # Step 5: Run DB migrations on the CI database
            - name: Run migrations
              run: npx prisma migrate deploy

            # Step 6: Run tests (unit/integration)
            - name: Run tests
              run: npm run test


    # ==========================
    # 2. DOCKER BUILD JOB
    # ==========================
    docker:
        # 👇 This ensures docker job ONLY runs if CI passes
        needs: ci

        runs-on: ubuntu-latest

        steps:
            # Pull latest code again (each job is isolated)
            - name: Checkout
              uses: actions/checkout@v4

            # Build Docker image from your Dockerfile
            - name: Build Docker Image
              run: docker build -t express-api .

        # ⚠️ Note: You're NOT pushing image to a registry yet
        # (like Docker Hub / ECR / GHCR) — just building locally


    # ==========================
    # 3. DEPLOYMENT JOB
    # ==========================
    deploy:
        # 👇 Runs only after docker job succeeds
        needs: docker

        runs-on: ubuntu-latest

        # 👇 Extra safety: only deploy if it's main branch
        if: github.ref == 'refs/heads/main'

        steps:
            # Trigger deployment via webhook (Railway in your case)
            - name: Trigger Railway Deploy
              run: curl -X POST ${{ secrets.RAILWAY_WEBHOOK }}

        # 👇 secrets.RAILWAY_WEBHOOK is stored securely in GitHub Secrets