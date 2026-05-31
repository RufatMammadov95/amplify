import { Amplify } from 'aws-amplify';
import { confirmSignUp, getCurrentUser, signIn, signOut, signUp } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/data';
import React, { useEffect, useReducer, useState } from 'react';
import { Button, Col, Container, Form, Row, Table } from 'react-bootstrap';

import './App.css';
import outputs from './amplify_outputs.json';

Amplify.configure(outputs);

const client = generateClient<any>();

type Restaurant = {
  name: string;
  description: string;
  city: string;
};

const sampleRestaurants: Restaurant[] = [
  {
    name: 'Baku Restaurant',
    description: 'Traditional Azerbaijani dishes, kebabs, and fresh salads in central Baku.',
    city: 'Baku',
  },
  {
    name: 'Chef Muslim',
    description: 'Local home-style cuisine with plov, dolma, and a warm family atmosphere.',
    city: 'Sumgayıt',
  },
  {
    name: 'Sheki Saray',
    description: 'Regional Sheki flavors, piti, sweets, and tea service inspired by northern Azerbaijan.',
    city: 'Sheki',
  },
];

const normalizeRestaurant = (restaurant: Restaurant): Restaurant => ({
  ...restaurant,
  city: restaurant.name === 'Chef Muslim' ? 'Sumgait' : restaurant.city,
});

type AppState = {
  restaurants: Restaurant[];
  formData: Restaurant;
};

type Action =
  | {
      type: 'QUERY';
      payload: Restaurant[];
    }
  | {
      type: 'SET_FORM_DATA';
      payload: { [field: string]: string };
    };

const initialState: AppState = {
  restaurants: [],
  formData: {
    name: '',
    city: '',
    description: '',
  },
};

const reducer = (state: AppState, action: Action) => {
  switch (action.type) {
    case 'QUERY':
      return { ...state, restaurants: action.payload };
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    default:
      return state;
  }
};

const App: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationCode, setConfirmationCode] = useState('');
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    getCurrentUser()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    initializeRestaurantList();
  }, [isAuthenticated]);

  const getRestaurantList = async (): Promise<Restaurant[]> => {
    const { data } = await client.models.Restaurant.list({});
    const restaurants = data.map(({ name, description, city }: Restaurant) =>
      normalizeRestaurant({
        name,
        description,
        city,
      })
    );

    dispatch({
      type: 'QUERY',
      payload: restaurants,
    });

    return restaurants;
  };

  const initializeRestaurantList = async () => {
    const restaurants = await getRestaurantList();

    if (restaurants.length) {
      return;
    }

    await Promise.all(
      sampleRestaurants.map((restaurant) =>
        client.models.Restaurant.create(normalizeRestaurant(restaurant))
      )
    );

    await getRestaurantList();
  };

  const createNewRestaurant = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const { name, description, city } = state.formData;

    await client.models.Restaurant.create({
      name,
      description,
      city,
    });

    await getRestaurantList();
  };

  const handleChange = (e: any) =>
    dispatch({
      type: 'SET_FORM_DATA',
      payload: { [e.target.name]: e.target.value },
    });

  const handleAuth = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (needsConfirmation) {
        await confirmSignUp({ username: email, confirmationCode });
        setNeedsConfirmation(false);
        setIsSignUp(false);
        return;
      }

      if (isSignUp) {
        await signUp({
          username: email,
          password,
          options: {
            userAttributes: {
              email,
            },
          },
        });
        setNeedsConfirmation(true);
        return;
      }

      await signIn({ username: email, password });
      setIsAuthenticated(true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="App app-shell auth-shell">
        <Container>
          <Row className="justify-content-center">
            <Col md={6} lg={4}>
              <div className="auth-panel">
                <h1 className="app-title">Restaurant Finder</h1>
                <p className="app-subtitle">
                  {needsConfirmation
                    ? 'Enter the confirmation code from your email.'
                    : isSignUp
                    ? 'Create an account to manage your restaurants.'
                    : 'Sign in to view and add restaurants.'}
                </p>
                <Form onSubmit={handleAuth}>
                  <Form.Group controlId="authEmail">
                    <Form.Control
                      className="mb-3"
                      onChange={(e: any) => setEmail(e.target.value)}
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={email}
                    />
                  </Form.Group>
                  {!needsConfirmation ? (
                    <Form.Group controlId="authPassword">
                      <Form.Control
                        className="mb-3"
                        onChange={(e: any) =>
                          setPassword(e.target.value)
                        }
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={password}
                      />
                    </Form.Group>
                  ) : (
                    <Form.Group controlId="authConfirmationCode">
                      <Form.Control
                        className="mb-3"
                        onChange={(e: any) =>
                          setConfirmationCode(e.target.value)
                        }
                        type="text"
                        name="confirmationCode"
                        placeholder="Confirmation code"
                        value={confirmationCode}
                      />
                    </Form.Group>
                  )}
                  {authError ? <p className="text-danger">{authError}</p> : null}
                  <Button type="submit" className="w-100">
                    {needsConfirmation ? 'Confirm Account' : isSignUp ? 'Sign Up' : 'Sign In'}
                  </Button>
                  {!needsConfirmation ? (
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setAuthError('');
                      }}
                    >
                      {isSignUp ? 'Use existing account' : 'Create account'}
                    </Button>
                  ) : null}
                </Form>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="App app-shell dashboard-shell">
      <Container>
        <Row className="justify-content-center">
          <Col lg={10}>
            <div className="dashboard-header">
              <div>
                <h1 className="app-title">Restaurant Finder</h1>
                <p className="app-subtitle">Browse restaurants and add your favorite places.</p>
              </div>
              <Button type="button" variant="outline-secondary" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </Col>
        </Row>

        <Row className="justify-content-center">
          <Col md={8} lg={6}>
            <Form className="restaurant-form" onSubmit={createNewRestaurant}>
              <Form.Group controlId="formDataName">
                <Form.Control
                  className="mb-3"
                  onChange={handleChange}
                  type="text"
                  name="name"
                  placeholder="Name"
                />
              </Form.Group>
              <Form.Group controlId="formDataDescription">
                <Form.Control
                  className="mb-3"
                  onChange={handleChange}
                  type="text"
                  name="description"
                  placeholder="Description"
                />
              </Form.Group>
              <Form.Group controlId="formDataCity">
                <Form.Control
                  className="mb-3"
                  onChange={handleChange}
                  type="text"
                  name="city"
                  placeholder="City"
                />
              </Form.Group>
              <Button type="submit" className="w-100">
                Add New Restaurant
              </Button>
            </Form>
          </Col>
        </Row>

        {state.restaurants.length ? (
          <Row className="justify-content-center my-4">
            <Col lg={10}>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>City</th>
                  </tr>
                </thead>
                <tbody>
                  {state.restaurants.map((restaurant, index) => (
                    <tr key={`restaurant-${index}`}>
                      <td>{index + 1}</td>
                      <td>{restaurant.name}</td>
                      <td>{restaurant.description}</td>
                      <td>{restaurant.city}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Col>
          </Row>
        ) : null}
      </Container>
    </div>
  );
};

export default App;
