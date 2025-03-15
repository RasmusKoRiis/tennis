# Game, Set, Match! Tennis Dashboard

This project is a **Dash**-based dashboard for visualizing tennis performance metrics over time. It merges data from multiple CSV files containing tennis match statistics and displays various performance metrics such as accuracy, speed, unforced error trend, and a composite performance index (CPI).

The dashboard is designed with a modern, dark theme and features a responsive layout with interactive charts.

## Features

- **KPI Cards:**  
  Display overall averages for serve speed, serve accuracy, forehand speed/accuracy, and backhand speed/accuracy.

- **Accuracy Over Time:**  
  A line chart (300px height) showing the progression of serve, forehand, and backhand accuracy over time.

- **Speed Progress Over Time:**  
  A larger line chart (180px height) showing the progression of serve, forehand, and backhand speeds.  
  - The legend is removed so that it does not overlap the chart.

- **Unforced Error Trend:**  
  A line chart (180px height) displaying the trend of unforced error rates over time.

- **Composite Performance Index (CPI) Over Time:**  
  A chart that calculates a composite index based on average speed, accuracy, and unforced error rate.  
  - The CPI chart fills the bottom row.
  - The y-axis is static (set to range from 0 to 1) to provide consistent scaling.

## Requirements

- Python 3.7+
- [Dash](https://dash.plotly.com/)
- [Pandas](https://pandas.pydata.org/)
- [Plotly](https://plotly.com/python/)

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-username/tennis-dashboard.git
   cd tennis-dashboard
    ```

## Set Up a Virtual Environment (optional but recommended)

```bash
python -m venv tennis-env
source tennis-env/bin/activate  # On Windows: tennis-env\Scripts\activate
 ```

## Install the Dependencies

```bash
pip install dash pandas plotly
 ```

##  Organize Your Data
Create a folder named data in the project directory. The data folder should contain subfolders named by date (formatted as YYYY-MM-DD) and within each subfolder include:

- Shots-Table 1.csv
- Points-Table 1.csv
- The CSV files should be semicolon-delimited with decimal commas.

## Running the Dashboard
After installation, run the dashboard with:

```bash
python app.py
 ```

 Then open your browser and navigate to http://XXX to interact with the dashboard.

 ## Code Structure

### Data Processing Functions

- **process_shots(shots_file):**  
  Reads and processes the Shots CSV file to calculate average speed, accuracy, and counts for each stroke.

- **process_points(points_file, shot_players):**  
  Reads and processes the Points CSV file to calculate unforced error rates.

- **load_session(folder_path):**  
  Loads and merges Shots and Points data from a session folder.

- **load_all_data(root="data"):**  
  Iterates over the data folder to combine data from all sessions.

### Dashboard Layout

The layout is defined using Dash HTML and DCC components and includes:

- A top header with the title and a player selection dropdown.
- A section for KPI cards.
- A main area with a two-column layout containing:
  - **Left column:** Accuracy Over Time chart.
  - **Right column:** Speed Progress Over Time and Unforced Error Trend charts.
- A bottom row that spans the full width, showing the Composite Performance Index chart.

### Callbacks

The callback updates all charts and KPI cards based on the selected player.

### Customization

- **Chart Heights & Margins:**  
  You can adjust the height of individual charts in the layout by modifying the `style` attribute of the `dcc.Graph` components.

- **Legend Positioning:**  
  Legends for charts are positioned using the `legend` parameter in the `update_layout()` calls. For example, the Speed chart has its legend removed (`showlegend=False`), while others have legends positioned above the charts.

- **Static Y-Axis for CPI:**  
  The CPI chart’s y-axis is fixed (in this case from 0 to 1). You can change the `range` parameter in the layout if needed.
