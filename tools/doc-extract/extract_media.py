"""從 WordOpenXML（flat OPC）抽出所有內嵌圖片（binData / binaryData）。"""
import base64, os, sys, re
import xml.etree.ElementTree as ET

PKG = "{http://schemas.microsoft.com/office/2006/xmlPackage}"


def main(path, outdir):
    os.makedirs(outdir, exist_ok=True)
    root = ET.parse(path).getroot()
    n = 0
    for part in root.findall(PKG + "part"):
        name = part.get(PKG + "name") or ""
        ct = part.get(PKG + "contentType") or ""
        if not ct.startswith("image/"):
            continue
        for data in part.findall(PKG + "binaryData"):
            raw = (data.text or "").strip()
            if not raw:
                continue
            try:
                blob = base64.b64decode(raw)
            except Exception as e:
                print("skip", name, e)
                continue
            ext = {"image/x-wmf": ".wmf", "image/x-emf": ".emf",
                   "image/png": ".png", "image/jpeg": ".jpg",
                   "image/gif": ".gif", "image/bmp": ".bmp"}.get(ct, ".bin")
            safe = re.sub(r"[^A-Za-z0-9]+", "_", name)
            fn = os.path.join(outdir, "%03d_%s%s" % (n, safe[-30:], ext))
            open(fn, "wb").write(blob)
            n += 1
    print("wrote", n, "images to", outdir)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
