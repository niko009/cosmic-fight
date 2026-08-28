using Godot;

namespace CosmicFight;

public partial class Main : Control
{
    private static readonly Color PlayerBlue = new("54c8ff");
    private static readonly Color EnemyRed = new("ff5664");

    public override void _Ready()
    {
        QueueRedraw();
    }

    public override void _Draw()
    {
        var size = Size;
        DrawRect(new Rect2(Vector2.Zero, size), new Color("05091a"));

        DrawCircle(new Vector2(size.X * 0.14f, size.Y * 0.30f), size.X * 0.35f, new Color(0.08f, 0.12f, 0.28f, 0.22f));
        DrawCircle(new Vector2(size.X * 0.90f, size.Y * 0.62f), size.X * 0.42f, new Color(0.20f, 0.05f, 0.18f, 0.16f));
        DrawStars(size);

        DrawShip(new Vector2(size.X * 0.5f, size.Y * 0.35f), size.X * 0.18f, EnemyRed, true);
        DrawShip(new Vector2(size.X * 0.5f, size.Y * 0.72f), size.X * 0.20f, PlayerBlue, false);

        DrawLine(new Vector2(size.X * 0.5f, size.Y * 0.45f), new Vector2(size.X * 0.5f, size.Y * 0.59f), new Color(0.32f, 0.48f, 0.72f, 0.22f), 2f);
        DrawCircle(new Vector2(size.X * 0.5f, size.Y * 0.52f), 4f, new Color(0.65f, 0.82f, 1f, 0.65f));
    }

    private void DrawStars(Vector2 size)
    {
        for (var i = 0; i < 72; i++)
        {
            var x = Mathf.PosMod(i * 97 + 31, 719) / 719f * size.X;
            var y = Mathf.PosMod(i * 193 + 47, 1279) / 1279f * size.Y;
            var radius = i % 11 == 0 ? 1.8f : 0.8f;
            var alpha = 0.28f + (i % 5) * 0.11f;
            DrawCircle(new Vector2(x, y), radius, new Color(0.72f, 0.84f, 1f, alpha));
        }
    }

    private void DrawShip(Vector2 center, float scale, Color accent, bool pointsDown)
    {
        var direction = pointsDown ? 1f : -1f;
        Vector2 P(float x, float y) => center + new Vector2(x, y * direction) * scale;

        var shadow = new[] { P(0f, -0.72f), P(0.78f, 0.5f), P(0.27f, 0.34f), P(0f, 0.75f), P(-0.27f, 0.34f), P(-0.78f, 0.5f) };
        DrawColoredPolygon(shadow, new Color(0f, 0f, 0f, 0.42f));

        var hull = new[] { P(0f, -0.82f), P(0.65f, 0.47f), P(0.22f, 0.30f), P(0f, 0.67f), P(-0.22f, 0.30f), P(-0.65f, 0.47f) };
        DrawColoredPolygon(hull, new Color("263149"));
        DrawPolyline(new[] { hull[0], hull[1], hull[2], hull[3], hull[4], hull[5], hull[0] }, accent, 4f, true);

        var core = new[] { P(0f, -0.42f), P(0.19f, 0.18f), P(0f, 0.43f), P(-0.19f, 0.18f) };
        DrawColoredPolygon(core, new Color(accent, 0.62f));
        DrawLine(P(-0.48f, 0.36f), P(-0.12f, 0.20f), new Color(0.72f, 0.78f, 0.88f, 0.7f), 3f);
        DrawLine(P(0.48f, 0.36f), P(0.12f, 0.20f), new Color(0.72f, 0.78f, 0.88f, 0.7f), 3f);
        DrawCircle(P(-0.16f, 0.51f), scale * 0.06f, accent);
        DrawCircle(P(0.16f, 0.51f), scale * 0.06f, accent);
    }
}
