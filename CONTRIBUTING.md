# Contributing to Axeptio Headless CMP Client

## Commit Message Guidelines

This project uses [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

### Commit Message Format

Each commit message consists of a **header**, a **body** and a **footer**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of the following:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **chore**: Changes to the build process or auxiliary tools and libraries
- **ci**: Changes to CI configuration files and scripts
- **build**: Changes that affect the build system or external dependencies

### Scope

The scope should be the name of the affected module/platform:

- `api` - API related changes
- `ios` - iOS SDK changes
- `android` - Android SDK changes
- `react-native` - React Native SDK changes
- `flutter` - Flutter SDK changes
- `docs` - Documentation changes
- `examples` - Example app changes
- `sdks` - General SDK changes
- `config` - Configuration changes
- `deps` - Dependency updates

### Subject

The subject contains a succinct description of the change:

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end
- Minimum 5 characters

### Examples

```
feat(ios): add offline consent queueing support
fix(android): resolve memory leak in consent manager
docs(react-native): update authentication guide
chore(deps): update expo to v49.0.0
```

### Using Commitizen

For easier commit message formatting, you can use Commitizen:

```bash
npm run commit
```

This will prompt you through creating a properly formatted commit message.

## Development Setup

1. Install dependencies:
```bash
npm install
```

2. Husky will automatically set up git hooks for commit message validation.

## Pull Request Process

1. Ensure your commits follow the conventional commit format
2. Update documentation for any API changes
3. Add tests for new features
4. Ensure all tests pass before submitting