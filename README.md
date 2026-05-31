# Restaurant Finder

Restaurant Finder is a cloud-hosted React application for browsing and adding restaurants. Users can create an account, sign in, view their restaurant list, and add new restaurants with a name, description, and city.

## Live Demo

https://main.d3vv4ie4r254x2.amplifyapp.com/

## Features

- Email-based sign up and sign in with AWS Amplify Auth
- Account confirmation flow using the email verification code
- Protected restaurant list for signed-in users
- Starter restaurant data for new users
- Add new restaurants and see them appear in the list
- Cloud deployment with AWS Amplify Hosting

## Tech Stack

- React
- TypeScript
- React Bootstrap
- AWS Amplify Gen 2
- Amazon Cognito
- AWS AppSync and Amplify Data

## Getting Started

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm start
```

Start the Amplify backend sandbox:

```bash
npx ampx sandbox
```

## Deployment

The project is deployed on AWS Amplify Hosting. The build pipeline deploys the Amplify backend and generates the frontend configuration before building the React app.

## Review Checklist

- Hosted in the cloud
- Supports account creation
- Supports sign in and sign out
- Displays a restaurant list
- Includes realistic restaurant data
- Allows users to add a restaurant
- Shows newly added restaurants in the list
