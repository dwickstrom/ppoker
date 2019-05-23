module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      // ts-jest configuration goes here
    }
  },
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(tsx?)$",
};