# Git Cheatsheet (ResManager)

Branches: `main` (stable, never edit directly), `frontend`, `backend`, `database`.

## One-time setup (each laptop)
```
git clone <repo-url>
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global pull.rebase false
```

## Daily routine
```
git switch <branch>          # go to your branch
git pull                     # ALWAYS first
# ...work...
git status                   # what changed?
git add <file>               # stage one file (git add . = everything)
git commit -m "Short clear message"
git push
```
First push of a brand-new branch: `git push -u origin <branch>`

## Branches
```
git branch                   # list local, * = current
git branch -a                # include GitHub ones
git switch <name>            # change branch
git switch -c <name>         # create + switch
```
Switching changes the files in your folder to match that branch.
Unsaved changes blocking a switch? Commit them, or `git stash`.

## Bring one branch's work into another
**Safe way (pull request on GitHub):** push branch -> "Compare & pull request" -> base `main` -> check files -> "Merge pull request". Then everyone: `git switch main` and `git pull`.

**Local way:**
```
git switch main
git pull
git merge database           # bring database INTO main
git push
```
**Get the latest main into your branch:**
```
git switch frontend
git pull
git merge main
```
Merge goes INTO the branch you are standing on.

## Conflicts
Happens only when both edit the same lines of the same file. The file shows:
```
<<<<<<< HEAD
your version
=======
their version
>>>>>>> branch-name
```
1. Open the file in VS Code, click Accept Current / Incoming / Both (or edit by hand)
2. Delete any leftover `<<<`, `===`, `>>>` lines
3. `git add <file>` then `git commit`
Panicking? `git merge --abort` puts everything back.

## Push rejected?
Someone pushed first. `git pull`, then `git push` again.

## Stash (park unfinished work)
```
git stash                    # hide changes
git stash pop                # bring them back
git stash list
```

## Look around
```
git status
git diff                     # unstaged changes
git diff --staged            # staged changes
git log --oneline --graph --all
```

## Undo
| Situation | Command |
|---|---|
| Unstage a file | `git restore --staged <file>` |
| Throw away edits to a file (cannot undo!) | `git restore <file>` |
| Undo last commit, keep the changes (not pushed yet) | `git reset --soft HEAD~1` |
| Undo a commit already pushed | `git revert <commit-id>` (adds a new undo commit) |
| Committed on the wrong branch | stop, ask before touching anything |

## Never
- Commit directly to `main`
- `git push --force`
- Use `git reset --hard` unless you are sure
- Push passwords, `.env`, `target/`, `.idea/`, `node_modules/` (put them in `.gitignore`)
- Both edit the same file at the same time without telling each other

## Good habits
- `git pull` before starting, `git status` before committing
- Small commits, clear messages ("Add complaints page", not "changes")
- Merge into `main` only at milestones, via pull request
