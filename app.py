import os
import pandas as pd
import dash
from dash import dcc, html
from dash.dependencies import Input, Output
import plotly.graph_objs as go

##############################
# 1. Data Loading & Merging  #
##############################

def process_shots(shots_file):
    try:
        df = pd.read_csv(shots_file, sep=";", decimal=",")
    except Exception as e:
        print(f"Error reading {shots_file}: {e}")
        return pd.DataFrame()
    df.columns = [c.strip().lower() for c in df.columns]
    req_cols = {"player", "stroke", "result", "speed (km/h)"}
    if not req_cols.issubset(set(df.columns)):
        print(f"Shots file {shots_file} missing required columns.")
        return pd.DataFrame()
    valid_results = ["in", "out", "net"]
    df_valid = df[df["result"].str.lower().isin(valid_results)].copy()
    df_valid["success"] = df_valid["result"].str.lower().apply(lambda x: 1 if x == "in" else 0)
    df_valid["count"] = 1

    grp_acc = df_valid.groupby(["player", "stroke"]).agg(accuracy=("success", "mean")).reset_index()
    pivot_acc = grp_acc.pivot(index="player", columns="stroke", values="accuracy")
    pivot_acc.columns = [f"{col.lower()}_accuracy" for col in pivot_acc.columns]
    pivot_acc.reset_index(inplace=True)

    grp_speed = df_valid.groupby(["player", "stroke"]).agg(avg_speed=("speed (km/h)", "mean")).reset_index()
    pivot_speed = grp_speed.pivot(index="player", columns="stroke", values="avg_speed")
    pivot_speed.columns = [f"{col.lower()}_speed" for col in pivot_speed.columns]
    pivot_speed.reset_index(inplace=True)

    grp_count = df_valid.groupby(["player", "stroke"]).agg(total=("count", "sum")).reset_index()
    pivot_count = grp_count.pivot(index="player", columns="stroke", values="total")
    pivot_count.columns = [f"{col.lower()}_count" for col in pivot_count.columns]
    pivot_count.reset_index(inplace=True)

    merged = pd.merge(pivot_speed, pivot_acc, on="player", how="outer")
    merged = pd.merge(merged, pivot_count, on="player", how="outer")
    for stroke in ["serve", "forehand", "backhand"]:
        for metric in [f"{stroke}_speed", f"{stroke}_accuracy", f"{stroke}_count"]:
            if metric not in merged.columns:
                merged[metric] = 0
    return merged

def process_points(points_file, shot_players):
    try:
        df = pd.read_csv(points_file, sep=";", decimal=",")
    except Exception as e:
        print(f"Error reading {points_file}: {e}")
        return pd.DataFrame()
    df.columns = [c.strip().lower() for c in df.columns]
    if "point winner" not in df.columns or "detail" not in df.columns:
        print(f"Points file {points_file} missing required columns.")
        return pd.DataFrame()
    total_points = len(df)
    if total_points == 0:
        return pd.DataFrame()
    df["detail"] = df["detail"].astype(str)
    df["unforced"] = df["detail"].str.lower().apply(lambda x: 1 if "unforced error" in x else 0)
    host_name = "Rasmus Kopperud Riis"
    guest_candidates = [p for p in shot_players if p.lower() != host_name.lower()]
    guest_name = guest_candidates[0] if guest_candidates else None
    host_errors = 0
    guest_errors = 0
    for _, row in df.iterrows():
        if row["unforced"] == 1:
            winner = str(row["point winner"]).strip().lower()
            if winner == "host":
                guest_errors += 1
            elif winner == "guest":
                host_errors += 1
    host_rate = host_errors / total_points
    guest_rate = guest_errors / total_points
    data = []
    data.append({"player": host_name, "unforced_error_rate": host_rate})
    if guest_name:
        data.append({"player": guest_name, "unforced_error_rate": guest_rate})
    return pd.DataFrame(data)

def load_session(folder_path):
    shots_file = os.path.join(folder_path, "Shots-Table 1.csv")
    points_file = os.path.join(folder_path, "Points-Table 1.csv")
    if not (os.path.exists(shots_file) and os.path.exists(points_file)):
        return pd.DataFrame()
    shots_df = process_shots(shots_file)
    if shots_df.empty:
        return pd.DataFrame()
    shot_players = shots_df["player"].unique().tolist()
    points_df = process_points(points_file, shot_players)
    if points_df.empty:
        return pd.DataFrame()
    merged = pd.merge(shots_df, points_df, on="player", how="left")
    date_str = os.path.basename(folder_path)
    try:
        session_date = pd.to_datetime(date_str, format="%Y-%m-%d")
    except:
        session_date = pd.NaT
    merged["date"] = session_date
    return merged

def load_all_data(root="data"):
    all_frames = []
    for folder in os.listdir(root):
        folder_path = os.path.join(root, folder)
        if os.path.isdir(folder_path):
            df_session = load_session(folder_path)
            if not df_session.empty:
                all_frames.append(df_session)
    if not all_frames:
        return pd.DataFrame()
    df = pd.concat(all_frames, ignore_index=True)
    df.sort_values("date", inplace=True)
    return df

# New helper functions for Points-based charts

def get_points_won_by_session(root="data"):
    records = []
    for folder in os.listdir(root):
        folder_path = os.path.join(root, folder)
        points_file = os.path.join(folder_path, "Points-Table 1.csv")
        if os.path.exists(points_file):
            try:
                df = pd.read_csv(points_file, sep=";", decimal=",")
            except Exception as e:
                print(f"Error reading {points_file}: {e}")
                continue
            df.columns = [c.strip().lower() for c in df.columns]
            if "point winner" not in df.columns:
                continue
            counts = df["point winner"].value_counts().to_dict()
            date_str = os.path.basename(folder_path)
            try:
                session_date = pd.to_datetime(date_str, format="%Y-%m-%d")
            except:
                session_date = pd.NaT
            records.append({
                "date": session_date,
                "host_points": counts.get("host", 0),
                "guest_points": counts.get("guest", 0)
            })
    if records:
        return pd.DataFrame(records).sort_values("date")
    else:
        return pd.DataFrame(columns=["date", "host_points", "guest_points"])

def get_aggregated_game_points_by_session(root="data"):
    records = []
    for folder in os.listdir(root):
        folder_path = os.path.join(root, folder)
        points_file = os.path.join(folder_path, "Points-Table 1.csv")
        if os.path.exists(points_file):
            try:
                df = pd.read_csv(points_file, sep=";", decimal=",")
            except Exception as e:
                print(f"Error reading {points_file}: {e}")
                continue
            df.columns = [c.strip().lower() for c in df.columns]
            # Expect columns: "game", "host game score", "guest game score"
            if "game" not in df.columns or "host game score" not in df.columns or "guest game score" not in df.columns:
                continue
            df["host game score"] = pd.to_numeric(df["host game score"], errors="coerce")
            df["guest game score"] = pd.to_numeric(df["guest game score"], errors="coerce")
            game_scores = df.groupby("game").agg({
                "host game score": "max",
                "guest game score": "max"
            }).reset_index()
            total_host = game_scores["host game score"].sum()
            total_guest = game_scores["guest game score"].sum()
            date_str = os.path.basename(folder_path)
            try:
                session_date = pd.to_datetime(date_str, format="%Y-%m-%d")
            except:
                session_date = pd.NaT
            records.append({
                "date": session_date,
                "host_total": total_host,
                "guest_total": total_guest
            })
    if records:
        return pd.DataFrame(records).sort_values("date")
    else:
        return pd.DataFrame(columns=["date", "host_total", "guest_total"])

##############################
# 2. Dash App & Layout       #
##############################

app = dash.Dash(__name__)
app.title = "Game, Set, Match!"

master_df = load_all_data("data")
if master_df.empty:
    print("Warning: No valid session data loaded. Check your CSV files and folder structure.")
players = sorted(master_df["player"].dropna().unique())

# Load new Points-based data
points_won_df = get_points_won_by_session("data")
agg_game_points_df = get_aggregated_game_points_by_session("data")

# Colors & styles
DARK_BG = "#1f2c56"
CARD_BG = "#20344a"
TEXT_COLOR = "#fff"
KPI_BG = "#FFD700"
KPI_TEXT_COLOR = "#00008B"

app.layout = html.Div(
    style={
        "backgroundColor": DARK_BG,
        "color": TEXT_COLOR,
        "height": "100vh",
        "overflowY": "auto",
        "padding": "20px",
        "fontFamily": "Arial, sans-serif"
    },
    children=[
        # Top header with title & dropdown
        html.Div(
            style={"display": "flex", "justifyContent": "space-between", "alignItems": "center", "marginBottom": "20px"},
            children=[
                html.H2("Game, Set, Match!", style={"margin": 0}),
                dcc.Dropdown(
                    id="player-dropdown",
                    options=[{"label": p, "value": p} for p in players],
                    value=players[0] if players else None,
                    style={
                        "width": "250px",
                        "color": "#000",
                        "backgroundColor": "#fff",
                        "borderRadius": "4px",
                        "padding": "5px",
                        "boxShadow": "0 2px 4px rgba(0,0,0,0.2)",
                        "transition": "all 0.5s ease"
                    }
                )
            ]
        ),
        # KPI Boxes
        html.Div(
            id="kpi-boxes",
            style={"display": "flex", "flexWrap": "wrap", "gap": "20px", "marginBottom": "20px"}
        ),
        # Main area: left column (Accuracy), right column (Speed & UFE)
        html.Div(
            style={"display": "flex", "flexDirection": "row", "gap": "20px"},
            children=[
                html.Div(
                    style={"flex": "2", "backgroundColor": CARD_BG, "padding": "20px", "borderRadius": "8px"},
                    children=[
                        html.H4("Accuracy Over Time", style={"marginTop": 0}),
                        dcc.Graph(id="accuracy-line-chart", style={"height": "400px"})
                    ]
                ),
                html.Div(
                    style={"flex": "1", "display": "flex", "flexDirection": "column", "gap": "20px"},
                    children=[
                        html.Div(
                            style={"flex": "1", "backgroundColor": CARD_BG, "padding": "20px", "borderRadius": "8px"},
                            children=[
                                html.H4("Speed Progress Over Time", style={"marginTop": 0}),
                                dcc.Graph(id="speed-line-chart", style={"height": "180px"})
                            ]
                        ),
                        html.Div(
                            style={"flex": "1", "backgroundColor": CARD_BG, "padding": "20px", "borderRadius": "8px"},
                            children=[
                                html.H4("Unforced Error Trend", style={"marginTop": 0}),
                                dcc.Graph(id="ufe-trend-chart", style={"height": "180px"})
                            ]
                        )
                    ]
                )
            ]
        ),
        # Bottom row: Composite Performance Index (full width)
        html.Div(
            style={
                "marginTop": "40px",
                "backgroundColor": CARD_BG,
                "padding": "20px",
                "borderRadius": "8px"
            },
            children=[
                html.H4("Composite Performance Index Over Time", style={"marginTop": 0}),
                dcc.Graph(id="composite-chart", style={"height": "400px"})
            ]
        ),
        # New bottom row: Two charts side-by-side
        html.Div(
            style={"display": "flex", "flexDirection": "row", "gap": "20px", "marginTop": "40px"},
            children=[
                html.Div(
                    style={"flex": "1", "backgroundColor": CARD_BG, "padding": "20px", "borderRadius": "8px"},
                    children=[
                        html.H4("Points Won Per Session", style={"marginTop": 0}),
                        dcc.Graph(id="points-won-chart", style={"height": "400px"})
                    ]
                ),
                html.Div(
                    style={"flex": "1", "backgroundColor": CARD_BG, "padding": "20px", "borderRadius": "8px"},
                    children=[
                        html.H4("Aggregated Game Points Ratio", style={"marginTop": 0}),
                        dcc.Graph(id="aggregated-game-points-chart", style={"height": "400px"})
                    ]
                )
            ]
        )
    ]
)

###################################
# 3. Callback to Update Charts & KPIs
###################################

@app.callback(
    [
        Output("kpi-boxes", "children"),
        Output("accuracy-line-chart", "figure"),
        Output("speed-line-chart", "figure"),
        Output("ufe-trend-chart", "figure"),
        Output("composite-chart", "figure"),
        Output("points-won-chart", "figure"),
        Output("aggregated-game-points-chart", "figure")
    ],
    [Input("player-dropdown", "value")]
)
def update_charts(selected_player):
    if not selected_player or master_df.empty:
        empty_fig = go.Figure()
        return "", empty_fig, empty_fig, empty_fig, empty_fig, empty_fig, empty_fig

    pdf = master_df[master_df["player"] == selected_player].copy()
    if pdf.empty:
        empty_fig = go.Figure()
        return "", empty_fig, empty_fig, empty_fig, empty_fig, empty_fig, empty_fig

    # KPI calculations
    serve_speed_avg = pdf["serve_speed"].mean()
    serve_acc_avg = pdf["serve_accuracy"].mean()
    fh_speed_avg = pdf["forehand_speed"].mean()
    fh_acc_avg = pdf["forehand_accuracy"].mean()
    bh_speed_avg = pdf["backhand_speed"].mean()
    bh_acc_avg = pdf["backhand_accuracy"].mean()

    def create_kpi_card(title, value, suffix=""):
        return html.Div(
            children=[
                html.H4(title, style={"margin": "0", "fontSize": "16px", "color": KPI_TEXT_COLOR}),
                html.P(
                    f"{value:.1f}{suffix}" if isinstance(value, float) else str(value),
                    style={"margin": "0", "fontSize": "24px", "fontWeight": "bold", "color": KPI_TEXT_COLOR}
                )
            ],
            style={
                "backgroundColor": KPI_BG,
                "padding": "10px",
                "borderRadius": "5px",
                "flex": "1",
                "textAlign": "center"
            }
        )

    kpi_cards = html.Div(
        children=[
            create_kpi_card("Serve Speed", serve_speed_avg, " km/h"),
            create_kpi_card("Serve Accuracy", serve_acc_avg),
            create_kpi_card("Forehand Speed", fh_speed_avg, " km/h"),
            create_kpi_card("Forehand Accuracy", fh_acc_avg),
            create_kpi_card("Backhand Speed", bh_speed_avg, " km/h"),
            create_kpi_card("Backhand Accuracy", bh_acc_avg)
        ],
        style={"display": "flex", "flexWrap": "wrap", "gap": "20px"}
    )

    # Accuracy Over Time Chart
    acc_fig = go.Figure()
    acc_fig.add_trace(go.Scatter(
        x=pdf["date"],
        y=pdf["serve_accuracy"],
        mode="lines+markers",
        name="Serve Accuracy"
    ))
    acc_fig.add_trace(go.Scatter(
        x=pdf["date"],
        y=pdf["forehand_accuracy"],
        mode="lines+markers",
        name="Forehand Accuracy"
    ))
    acc_fig.add_trace(go.Scatter(
        x=pdf["date"],
        y=pdf["backhand_accuracy"],
        mode="lines+markers",
        name="Backhand Accuracy"
    ))
    acc_fig.update_layout(
        paper_bgcolor=CARD_BG,
        plot_bgcolor=CARD_BG,
        font=dict(color=TEXT_COLOR),
        margin=dict(t=20, b=20, l=20, r=20),
        xaxis=dict(title="", gridcolor="#2a3f5f"),
        yaxis=dict(title="Success Rate (0-1)", gridcolor="#2a3f5f", range=[0,1]),
        legend=dict(orientation="h", y=1.15, x=0.5, xanchor="center")
    )

    # Speed Over Time Chart (legend removed, area chart with 60% opacity)
    speed_fig = go.Figure()
    speed_fig.add_trace(go.Scatter(
        x=pdf["date"],
        y=pdf["serve_speed"],
        mode="lines+markers",
        name="Serve Speed",
        fill="tozeroy",
        fillcolor="rgba(255, 165, 0, 0.6)",  # orange with 60% opacity
        line=dict(color="rgb(255, 165, 0)")
    ))
    speed_fig.add_trace(go.Scatter(
        x=pdf["date"],
        y=pdf["forehand_speed"],
        mode="lines+markers",
        name="Forehand Speed",
        fill="tozeroy",
        fillcolor="rgba(60, 179, 113, 0.6)",  # medium sea green with 60% opacity
        line=dict(color="rgb(60, 179, 113)")
    ))
    speed_fig.add_trace(go.Scatter(
        x=pdf["date"],
        y=pdf["backhand_speed"],
        mode="lines+markers",
        name="Backhand Speed",
        fill="tozeroy",
        fillcolor="rgba(65, 105, 225, 0.6)",  # royal blue with 60% opacity
        line=dict(color="rgb(65, 105, 225)")
    ))
    speed_fig.update_layout(
        paper_bgcolor=CARD_BG,
        plot_bgcolor=CARD_BG,
        font=dict(color=TEXT_COLOR),
        margin=dict(t=20, b=20, l=20, r=20),
        xaxis=dict(title="", gridcolor="#2a3f5f"),
        yaxis=dict(title="Speed (km/h)", gridcolor="#2a3f5f", range=[40,180]),
        showlegend=False
    )

    # Unforced Error Trend Chart
    ufe_fig = go.Figure()
    ufe_fig.add_trace(go.Scatter(
        x=pdf["date"],
        y=pdf["unforced_error_rate"],
        mode="lines+markers",
        name="UFE Rate",
        line=dict(color="#f7a942")
    ))
    ufe_fig.update_layout(
        paper_bgcolor=CARD_BG,
        plot_bgcolor=CARD_BG,
        font=dict(color=TEXT_COLOR),
        margin=dict(t=20, b=20, l=20, r=20),
        xaxis=dict(title="", gridcolor="#2a3f5f"),
        yaxis=dict(title="Error Rate", gridcolor="#2a3f5f", range=[0.1,0.6]),
        legend=dict(orientation="h", y=1.15, x=0.5, xanchor="center")
    )

    # Composite Performance Index Over Time
    pdf["avg_speed"] = (pdf["serve_speed"] + pdf["forehand_speed"] + pdf["backhand_speed"]) / 3
    pdf["avg_accuracy"] = (pdf["serve_accuracy"] + pdf["forehand_accuracy"] + pdf["backhand_accuracy"]) / 3
    pdf["normalized_speed"] = (pdf["avg_speed"] - 40) / 170
    pdf["composite_index"] = pdf["normalized_speed"] * pdf["avg_accuracy"] * (1 - pdf["unforced_error_rate"])
    cpi_fig = go.Figure()
    cpi_fig.add_trace(go.Scatter(
        x=pdf["date"],
        y=pdf["composite_index"],
        mode="lines+markers",
        name="Composite Performance Index"
    ))
    cpi_fig.update_layout(
        paper_bgcolor=CARD_BG,
        plot_bgcolor=CARD_BG,
        font=dict(color=TEXT_COLOR),
        margin=dict(t=20, b=20, l=20, r=20),
        xaxis=dict(title="", gridcolor="#2a3f5f"),
        yaxis=dict(title="Composite Index", gridcolor="#2a3f5f", range=[0,0.5]),
        legend=dict(orientation="h", y=1.15, x=0.5, xanchor="center")
    )

    # New Chart: Points Won Per Session as Area Chart
    points_won_df = get_points_won_by_session("data")
    # For points, if selected player is host, use host_points; else guest_points.
    host_name = "Rasmus Kopperud Riis"
    if selected_player.lower() == host_name.lower():
        points_series = points_won_df["host_points"]
    else:
        points_series = points_won_df["guest_points"]

    points_won_fig = go.Figure(data=[
        go.Scatter(
            x=points_won_df["date"],
            y=points_series,
            mode="lines+markers",
            fill="tozeroy",
            fillcolor="rgba(255, 99, 71, 0.6)",  # tomato color with 60% opacity
            line=dict(color="rgb(255, 99, 71)"),
            name="Points Won"
        )
    ])
    points_won_fig.update_layout(
        paper_bgcolor=CARD_BG,
        plot_bgcolor=CARD_BG,
        font=dict(color=TEXT_COLOR),
        margin=dict(t=20, b=20, l=20, r=20),
        xaxis=dict(title="", gridcolor="#2a3f5f"),
        yaxis=dict(title="Points Won", gridcolor="#2a3f5f"),
        legend=dict(orientation="h", y=1.15, x=0.5, xanchor="center")
    )

    # New Chart: Aggregated Game Points Ratio as Area Chart
    agg_game_points_df = get_aggregated_game_points_by_session("data")
    # Compute the ratio of aggregated points (selected player's total divided by opponent's total)
    if selected_player.lower() == host_name.lower():
        ratio_series = agg_game_points_df["host_total"] / agg_game_points_df["guest_total"].replace(0, pd.NA)
    else:
        ratio_series = agg_game_points_df["guest_total"] / agg_game_points_df["host_total"].replace(0, pd.NA)

    agg_game_points_fig = go.Figure(data=[
        go.Scatter(
            x=agg_game_points_df["date"],
            y=ratio_series,
            mode="lines+markers",
            fill="tozeroy",
            fillcolor="rgba(30, 144, 255, 0.6)",  # DodgerBlue with 60% opacity
            line=dict(color="rgb(30, 144, 255)"),
            name="Points Ratio"
        )
    ])
    agg_game_points_fig.update_layout(
        paper_bgcolor=CARD_BG,
        plot_bgcolor=CARD_BG,
        font=dict(color=TEXT_COLOR),
        margin=dict(t=20, b=20, l=20, r=20),
        xaxis=dict(title="", gridcolor="#2a3f5f"),
        yaxis=dict(title="Aggregated Points Ratio", gridcolor="#2a3f5f", range=[0,3]),
        legend=dict(orientation="h", y=1.15, x=0.5, xanchor="center")
    )

    return (
        kpi_cards,
        acc_fig,
        speed_fig,
        ufe_fig,
        cpi_fig,
        points_won_fig,
        agg_game_points_fig
    )

###################################
# 4. Run the Dash App             #
###################################

server = app.server  # Expose the Flask server

if __name__ == "__main__":
    app.run_server(debug=True, port=8053)
