import json
import unittest
from pathlib import Path

from oceanic import media, readiness, rsc, specs

PILOT = Path(__file__).resolve().parents[2] / "biblioteca" / "axopar" / "axopar-37-xc-cross-cabin"


def _record(value, sid="S1"):
    return {"source_id": sid, "source_name": "x", "url": "u", "accessed_at": "2026-01-01",
            "source_field": "f", "source_value": str(value), "source_unit": "l",
            "normalized_value": value, "normalized_unit": "l", "model_year": "2027"}


def _spec(fields):
    return {"model": {"boat_type": "vela"}, "fields": fields}


class TextRows(unittest.TestCase):
    def test_back_to_back_text_rows(self):
        # Text rows are not newline-terminated; the second one follows the first directly.
        # Lengths are UTF-8 bytes: "héllo" is 6 bytes.
        payload = '1:["$a"]\n33:T6,héllo34:T3,abc2:{"k":1}\n'
        rows = rsc.text_rows(payload)
        self.assertEqual(rows["$33"], "héllo")
        self.assertEqual(rows["$34"], "abc")

    def test_resolve_refs(self):
        self.assertEqual(rsc.resolve_refs({"d": "$34"}, {"$34": "abc"}), {"d": "abc"})


class Validation(unittest.TestCase):
    def test_verified_with_different_values_is_rejected(self):
        spec = _spec([{"oceanic_field": "capacidad_combustible", "label": "c", "status": "VERIFIED",
                       "display_value": "722 l", "records": [_record(722), _record(730, "S2")]}])
        self.assertTrue(any("debe ser CONFLICT" in e for e in specs.validate(spec)))

    def test_conflict_needs_two_records(self):
        spec = _spec([{"oceanic_field": "capacidad_combustible", "label": "c", "status": "CONFLICT",
                       "display_value": None, "records": [_record(722)]}])
        self.assertTrue(any("al menos dos" in e for e in specs.validate(spec)))

    def test_not_found_cannot_carry_values(self):
        spec = _spec([{"oceanic_field": "lastre", "label": "l", "status": "NOT_FOUND",
                       "display_value": None, "records": [_record(1)]}])
        self.assertTrue(any("NOT_FOUND" in e for e in specs.validate(spec)))

    def test_missing_critical_field_is_reported(self):
        errors = specs.validate(_spec([]))
        self.assertTrue(any("superficie_velica" in e for e in errors))


class DataSources(unittest.TestCase):
    def test_non_web_source_cannot_feed_data(self):
        import tempfile, shutil
        with tempfile.TemporaryDirectory() as tmp:
            model = Path(tmp) / "m"
            shutil.copytree(PILOT, model)
            spec_path = model / "02_ESPECIFICACIONES" / "specifications.json"
            spec = json.loads(spec_path.read_text())
            spec["fields"][0]["records"].append(dict(spec["fields"][0]["records"][0], source_id="S2"))
            spec_path.write_text(json.dumps(spec))
            self.assertTrue(any("no es web oficial" in e for e in specs.render(model)))


class WebCopy(unittest.TestCase):
    def test_web_copy_is_webp_and_capped(self):
        import io
        from PIL import Image
        buf = io.BytesIO()
        Image.new("RGB", (5000, 3000), "navy").save(buf, "JPEG")
        data, w, h = media._web_copy(buf.getvalue(), 1920)
        self.assertEqual((w, h), (1920, 1152))
        self.assertEqual(Image.open(io.BytesIO(data)).format, "WEBP")

    def test_pilot_stores_no_originals(self):
        files = [p for p in PILOT.rglob("*") if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".pdf")]
        self.assertEqual(files, [])


class Dash(unittest.TestCase):
    def test_not_found_dash_is_shown_in_table(self):
        spec = {"model": {"model": "m", "model_year": "1", "variant": "v", "configuration": "c",
                          "engine_option": "e", "boat_type": "motor"},
                "fields": [{"oceanic_field": "velocidad_crucero", "label": "Velocidad crucero",
                            "status": "NOT_FOUND", "display_value": "-", "records": [], "notes": ""}]}
        self.assertIn("| Velocidad crucero | - | NOT_FOUND |", specs.render_table(spec))


class Pilot(unittest.TestCase):
    def test_pilot_package_passes_rules(self):
        self.assertEqual(specs.render(PILOT), [])

    def test_pilot_is_not_green(self):
        # Missing critical fields and pending downloads must keep the pilot out of GREEN.
        result = readiness.evaluate(PILOT)
        self.assertEqual(result["CONTENT_STATUS"], "YELLOW")

    def test_base_table_is_complete(self):
        spec = json.loads((PILOT / "02_ESPECIFICACIONES" / "specifications.json").read_text())
        status = {f["oceanic_field"]: f["status"] for f in spec["fields"]}
        for key in specs.BASE_TABLE["motor"]:
            self.assertEqual(status.get(key), "VERIFIED", key)

    def test_missing_base_field_is_reported(self):
        spec = {"model": {"boat_type": "motor"}, "fields": []}
        self.assertTrue(any("tabla base desplazamiento" in e for e in specs.validate(spec)))

    def test_tech_spec_block_prevails(self):
        spec = json.loads((PILOT / "02_ESPECIFICACIONES" / "specifications.json").read_text())
        fuel = next(f for f in spec["fields"] if f["oceanic_field"] == "capacidad_combustible")
        self.assertEqual((fuel["status"], fuel["display_value"]), ("VERIFIED", "722 l"))
        self.assertEqual([r["source_value"] for r in fuel["records"]], ["722 l (191 gal)"])

    def test_no_other_model_image_marked_this_model(self):
        inv = json.loads((PILOT / "05_MULTIMEDIA" / "IMAGENES" / "images.json").read_text())
        for rec in inv["images"]:
            if "ax37st" in rec["dam_tags"] or "sun-top" in rec["id"]:
                self.assertNotEqual(rec["scope"], "THIS_MODEL", rec["id"])


if __name__ == "__main__":
    unittest.main()
