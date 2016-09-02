module.exports = {
  'greet': {
    description: 'Greet',
    command: 'echo "Hello world"',
    predicate: (payload, method) => {
      return true;
      // return {
      //   command: 'echo "Command overridden"',
      // };
    },
  },
};
