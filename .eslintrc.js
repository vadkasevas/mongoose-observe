module.exports = {
    "globals": {
        "BROWSER_SUPPORTS_HTML5": true
    },
    root: true,
    env: {
        node: true,
        "es6": true
    },
    'extends': [
        'eslint:recommended'
    ],
    rules: {
        'no-console': 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    },
    parserOptions: {
        "sourceType": "module",
        parser: 'babel-eslint',
        "ecmaFeatures": {
            "jsx": true,
            "modules": true,
            "ecmaVersion": 7,
            "experimentalObjectRestSpread": true,
        }
    },
    overrides: [
        {
            files: [
                '**/__tests__/*.{j,t}s?(x)'
            ],
            env: {
                mocha: true
            }
        }
    ]
}
