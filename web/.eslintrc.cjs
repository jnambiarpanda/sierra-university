// Copyright Sierra

module.exports = {
    extends: ["./node_modules/@sierra/web-react/.eslintrc.cjs"],
    parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: __dirname,
    },
};
