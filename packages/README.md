# Shared packages

Incremental shared layer for CPS and PowerFit360.

Current packages:

- `cps-contracts`: shared app origins, roles, RPC/table names and payment reference helpers.
- `cps-content`: canonical catalog for the current 12 tomos and Boxing/Kickboxing stages.
- `cps-evaluations`: canonical evaluation states, 100-point video rubric and 100-point live rubric.
- `cps-video`: shared upload validation, storage-path convention and attempt numbering.

These packages are intentionally validated directly by Node before npm workspaces are enabled. Production apps remain independent and unchanged during this phase.
