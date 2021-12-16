### React life cycle methods

Docs Link : https://reactjs.org/docs/react-component.html

- The render() function should be pure, meaning that it does not modify component state, it returns the same result each time it’s invoked, and it does not directly interact with the browser.
- If you don’t initialize state and you don’t bind methods, you don’t need to implement a constructor for your React component.
- Avoid introducing any side-effects or subscriptions in the constructor. For those use cases, use componentDidMount() instead.
