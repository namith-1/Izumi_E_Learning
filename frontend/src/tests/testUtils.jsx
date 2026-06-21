/**
 * Test helper: provides a Redux store wrapper and router for component tests.
 */
import React from 'react';
import { render } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

/**
 * Default slice reducers that mirror the real store shape.
 * Tests can override any slice via `preloadedState`.
 */
const defaultAuthState = { user: null, loading: false, error: null, errorDetail: null };
const defaultCoursesState = {
  list: [], hasMore: true, currentPage: 1, lastSearchQuery: '',
  currentCourse: null, loading: false, loadingMore: false, error: null,
  analyticsData: [], subjectTree: [], lastFetched: null, isSessionInitialized: false,
};
const defaultEnrollmentState = {
  currentEnrollment: undefined, enrolledList: [],
  lastEnrolledFetch: null, isSessionInitialized: false, loading: false, error: null,
};
const defaultPaymentState = {
  studentTransactions: [], teacherTransactions: [],
  studentSummary: null, teacherSummary: null, loading: false, error: null,
};
const defaultTeachersState = { entities: {}, loading: false, error: null };

const dummyReducer = (initialState) => (state = initialState) => state;

export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    route = '/',
    ...renderOptions
  } = {}
) {
  const store = configureStore({
    reducer: {
      auth: dummyReducer(preloadedState.auth || defaultAuthState),
      courses: dummyReducer(preloadedState.courses || defaultCoursesState),
      enrollment: dummyReducer(preloadedState.enrollment || defaultEnrollmentState),
      payments: dummyReducer(preloadedState.payments || defaultPaymentState),
      teachers: dummyReducer(preloadedState.teachers || defaultTeachersState),
    },
  });

  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>
          {children}
        </MemoryRouter>
      </Provider>
    );
  }

  return {
    store,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}
