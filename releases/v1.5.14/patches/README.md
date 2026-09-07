# v1.5.13 -> v1.5.14 core source patch

The canonical patch is stored as UTF-8 line-safe parts under `lineparts/`.

Reassemble in lexical order:

```sh
cat lineparts/v1513_to_v1514_core.patch.part00 \
    lineparts/v1513_to_v1514_core.patch.part01 \
    lineparts/v1513_to_v1514_core.patch.part02 \
    lineparts/v1513_to_v1514_core.patch.part03 \
    lineparts/v1513_to_v1514_core.patch.part04 \
    lineparts/v1513_to_v1514_core.patch.part05 \
    lineparts/v1513_to_v1514_core.patch.part06 > v1513_to_v1514_core.patch
sha256sum v1513_to_v1514_core.patch
```

Expected SHA256:

`446ad0771a3f47728436a948deb8edd066554ebb50b0898a9fd9c856b1fb5f03`

The older `*.patch.part00` ... byte-split files in the parent patch directory are non-canonical scratch persistence; use only the `lineparts/` series above for exact reconstruction.
