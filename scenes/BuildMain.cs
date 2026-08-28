using Godot;

namespace CosmicFight;

public partial class BuildMain : SceneTree
{
    public override void _Initialize()
    {
        var root = new Control { Name = "Main", LayoutMode = 3 };
        root.SetAnchorsAndOffsetsPreset(Control.LayoutPreset.FullRect);

        var title = MakeLabel("Title", "COSMIC FIGHT", 52, new Color("eaf7ff"));
        title.Position = new Vector2(0, 92);
        title.Size = new Vector2(720, 72);
        title.HorizontalAlignment = HorizontalAlignment.Center;
        root.AddChild(title);

        var subtitle = MakeLabel("Subtitle", "Prototype environment ready", 22, new Color("79cfff"));
        subtitle.Position = new Vector2(0, 162);
        subtitle.Size = new Vector2(720, 44);
        subtitle.HorizontalAlignment = HorizontalAlignment.Center;
        root.AddChild(subtitle);

        var enemy = MakeLabel("EnemyLabel", "ENEMY  •  PLACEHOLDER", 17, new Color("ff7b86"));
        enemy.Position = new Vector2(0, 548);
        enemy.Size = new Vector2(720, 34);
        enemy.HorizontalAlignment = HorizontalAlignment.Center;
        root.AddChild(enemy);

        var player = MakeLabel("PlayerLabel", "PLAYER  •  PLACEHOLDER", 17, new Color("62d1ff"));
        player.Position = new Vector2(0, 1052);
        player.Size = new Vector2(720, 34);
        player.HorizontalAlignment = HorizontalAlignment.Center;
        root.AddChild(player);

        var footer = MakeLabel("Footer", "MOBILE PORTRAIT  /  GODOT 4.7.2 .NET", 15, new Color(0.56f, 0.64f, 0.76f));
        footer.Position = new Vector2(0, 1205);
        footer.Size = new Vector2(720, 36);
        footer.HorizontalAlignment = HorizontalAlignment.Center;
        root.AddChild(footer);

        SetOwners(root, root);
        var temp = new Node();
        temp.AddChild(root);
        root.SetScript(GD.Load<Script>("res://scripts/Main.cs"));
        root = temp.GetChild<Control>(0);

        var expected = CountNodes(root);
        var packed = new PackedScene();
        if (packed.Pack(root) != Error.Ok)
        {
            GD.PushError("Could not pack Main scene.");
            Quit(1);
            return;
        }

        var test = packed.Instantiate();
        var actual = CountNodes(test);
        test.Free();
        if (actual != expected)
        {
            GD.PushError($"Main scene node mismatch: expected {expected}, got {actual}.");
            Quit(1);
            return;
        }

        var result = ResourceSaver.Save(packed, "res://scenes/Main.tscn");
        GD.Print($"Generated scenes/Main.tscn with {actual} nodes ({result}).");
        temp.Free();
        Quit(result == Error.Ok ? 0 : 1);
    }

    private static Label MakeLabel(string name, string text, int size, Color color)
    {
        var label = new Label { Name = name, Text = text };
        label.AddThemeFontSizeOverride("font_size", size);
        label.AddThemeColorOverride("font_color", color);
        return label;
    }

    private static void SetOwners(Node node, Node root)
    {
        foreach (Node child in node.GetChildren())
        {
            if (!string.IsNullOrEmpty(child.SceneFilePath))
                continue;
            child.Owner = root;
            SetOwners(child, root);
        }
    }

    private static int CountNodes(Node node)
    {
        var count = 1;
        foreach (Node child in node.GetChildren())
            count += CountNodes(child);
        return count;
    }
}
