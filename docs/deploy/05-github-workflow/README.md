# The deploy workflow

There is [a Github Workflow](../../../.github/workflows/deploy.yml) that,
on every commit into `main`, will...

- Build and tag Docker images
- Push images to Artifact Registry
- Create (or update) all necessary infrastructure via Terraform

## Default behavior

Commits into the `main` branch will trigger the workflow:

```yaml
on:
  push:
    branches:
      - main
```

The workflow then uses the Git commit short hash as the image tag,
extracting it like so:

```yaml
jobs:
  tag:
    # ...
    outputs:
      value: ${{ steps.docker-image-tag.outputs.value }}
    steps:
      # ...
      - id: docker-image-tag
        run: echo "::set-output name=value::$( git rev-parse --short HEAD )"
```

This tag can then be referenced in any job like so:

```yaml
jobs:
  tag:
    # ...

  build:
    # ...
    needs:
      - tag
    steps:
      - name: Echo tag
        run: echo ${{ needs.tag.outputs.value }}
```

## Tag Images By Git Tag

If, instead, you want the workflow to run when Git tags are created,
rather than when commits are made into a branch,
you can simply adjust the trigger and the method of extracting the tag.

```yaml
on:
  push:
    tags:
      - '*'

jobs:
  tag:
    # ...
    outputs:
      value: ${{ steps.docker-image-tag.outputs.value }}
    steps:
      # ...
      - id: docker-image-tag
        # Extract the tag from the github reference
        # See: https://github.community/t/how-to-get-just-the-tag-name/16241/32
        run: echo "::set-output name=value::${GITHUB_REF/refs\/tags\//}"
```

This will generate image names like `cms:v1.0.0` instead of `cms:6e36b60`.

---

## Next Up

[Completing the post-deploy steps](../06-post-deploy-steps/README.md)
