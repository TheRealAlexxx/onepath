# onepath

Fill every tile in one stroke, hitting the numbered checkpoints in order.

**Play:** https://therealalexxx.github.io/onepath/

Drag from S across the grid without lifting or crossing yourself. Numbered
tiles are checkpoints: pass 1 before 2, 2 before 3. Drag back over your last
tile to undo a step. Every level has exactly one solution, proven by search.

## How uniqueness is proven

`core.js` counts solutions with a depth-first search plus a cache of dead
states (position, checkpoint progress, visited set). It stops after finding
two, so a count of exactly 1 means unique. `gen.js` only ships levels where
that count is 1, and stores the witness path in `levels.json`.

``` 
node gen.js <seed> <count>
```

## Tests

```
node --test
```

Cross-checks the cached solver against a plain no-cache enumeration on small
grids, tests checkpoint ordering both in the solver and the path validator,
and re-proves uniqueness for every shipped level.

## License

MIT
