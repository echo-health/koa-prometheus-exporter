module.exports = {
    extends: ['airbnb-base', 'prettier'],
    env: {
        jest: true,
        es6: true,
    },
    rules: {
        'arrow-body-style': 0,
        'arrow-parens': ['error', 'as-needed'],
        'max-len': ['error', 100],
        'no-restricted-syntax': 'off',
        'func-names': 'off',
        'no-continue': 'off',
        'global-require': 'off',
        'class-methods-use-this': 0,
        'prefer-destructuring': ['error', { object: true, array: false }],
    },
};
