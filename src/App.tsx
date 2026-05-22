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

    getRestaurantList();
  }, [isAuthenticated]);

  const getRestaurantList = async () => {
    const { data } = await client.models.Restaurant.list({});

    dispatch({
      type: 'QUERY',
      payload: data.map(({ name, description, city }: Restaurant) => ({
        name,
        description,
        city,
      })),
    });
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
      <div className="App">
        <Container>
          <Row className="mt-3">
            <Col md={4}>
              <Form onSubmit={handleAuth}>
                <Form.Group controlId="authEmail">
                  <Form.Control
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
                <Button type="submit" className="float-left">
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
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="App">
      <Container>
        <Row className="mt-3">
          <Col md={4}>
            <Form onSubmit={createNewRestaurant}>
              <Form.Group controlId="formDataName">
                <Form.Control onChange={handleChange} type="text" name="name" placeholder="Name" />
              </Form.Group>
              <Form.Group controlId="formDataDescription">
                <Form.Control
                  onChange={handleChange}
                  type="text"
                  name="description"
                  placeholder="Description"
                />
              </Form.Group>
              <Form.Group controlId="formDataCity">
                <Form.Control onChange={handleChange} type="text" name="city" placeholder="City" />
              </Form.Group>
              <Button type="submit" className="float-left">
                Add New Restaurant
              </Button>
              <Button type="button" variant="link" onClick={handleSignOut}>
                Sign Out
              </Button>
            </Form>
          </Col>
        </Row>

        {state.restaurants.length ? (
          <Row className="my-3">
            <Col>
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
