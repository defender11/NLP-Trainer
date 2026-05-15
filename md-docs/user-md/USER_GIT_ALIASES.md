# USER_GIT_ALIASES.md

Необязательный пользовательский файл с git-алиасами для ускорения работы в терминале.

## Настройка

```sh
git config --global alias.co checkout  # псевдоним co для checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
```

## Использование

- `git co <branch>` вместо `git checkout <branch>`
- `git br` вместо `git branch`
- `git ci -m "message"` вместо `git commit -m "message"`
- `git st` вместо `git status`

Если алиасы не настроены локально, использовать обычные команды `git`.
