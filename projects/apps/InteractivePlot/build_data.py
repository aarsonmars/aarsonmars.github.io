"""
Generate optimized JSON data file with year information
"""

import pandas as pd
import json
import warnings
warnings.filterwarnings('ignore')

print("📊 Loading Traffic Collision Data...")
df = pd.read_csv('Data/Traffic_Collisions.csv')

# Parse datetime
df['Accident Date and Time'] = pd.to_datetime(df['Accident Date and Time'], errors='coerce')
df['Hour'] = df['Accident Date and Time'].dt.hour
df['Month'] = df['Accident Date and Time'].dt.month - 1  # 0-indexed for JS
df['Year'] = df['Accident Date and Time'].dt.year
df['DayOfWeek'] = df['Accident Date and Time'].dt.dayofweek  # 0=Monday

# Clean coordinates and dates
df = df.dropna(subset=['Latitude WGS84', 'Longitude WGS84'])
df = df.dropna(subset=['Year'])

print(f"✅ Loaded {len(df):,} records")

def clean_str(val):
    """Clean string values - handle NaN, None, and empty strings"""
    if val is None or (isinstance(val, float) and pd.isna(val)) or str(val).strip().lower() == 'nan':
        return 'Unknown'
    s = str(val).strip()
    return s if s else 'Unknown'

# Show year distribution
print("\n📅 Year Distribution:")
year_counts = df['Year'].value_counts().sort_index()
for year, count in year_counts.items():
    print(f"   {int(year)}: {count:,} collisions")

# Convert to optimized JSON format
print("\n🔄 Converting to JSON format...")

collisions = []
for idx, row in df.iterrows():
    # Determine severity level (0=none, 1=injury, 2=fatal)
    severity = 0
    if row.get('Non Fatal Injury', '') == 'Yes':
        severity = 1
    if row.get('Fatal Injury', '') == 'Yes':
        severity = 2
    
    collision = {
        'lat': round(float(row['Latitude WGS84']), 5),
        'lon': round(float(row['Longitude WGS84']), 5),
        'year': int(row['Year']),
        'month': int(row['Month']) if pd.notna(row['Month']) else 0,
        'hour': int(row['Hour']) if pd.notna(row['Hour']) else 12,
        'dow': int(row['DayOfWeek']) if pd.notna(row['DayOfWeek']) else 0,
        'sev': severity,  # 0=none, 1=injury, 2=fatal
        'ped': 1 if row.get('Pedestrian Collision', '') == 'Y' else 0,
        'bike': 1 if row.get('Bicycle Collision', '') == 'Y' else 0,
        'imp': 1 if row.get('Impaired Driving', '') == 'Y' else 0,
        'weather': clean_str(row.get('Weather Condition', 'Unknown')),
        'road': clean_str(row.get('Road Configuration', 'Unknown')),
        'light': clean_str(row.get('Light Condition', 'Unknown'))
    }
    collisions.append(collision)

# Calculate metadata
years = sorted(df['Year'].dropna().unique().astype(int).tolist())
metadata = {
    'years': years,
    'total': len(collisions),
    'center': {
        'lat': round(df['Latitude WGS84'].mean(), 4),
        'lon': round(df['Longitude WGS84'].mean(), 4)
    },
    'bounds': {
        'minLat': round(df['Latitude WGS84'].min(), 4),
        'maxLat': round(df['Latitude WGS84'].max(), 4),
        'minLon': round(df['Longitude WGS84'].min(), 4),
        'maxLon': round(df['Longitude WGS84'].max(), 4)
    }
}

# Save combined data
data = {
    'meta': metadata,
    'collisions': collisions
}

print("💾 Saving to src/data.json...")
with open('src/data.json', 'w') as f:
    json.dump(data, f, separators=(',', ':'))

file_size = len(json.dumps(data, separators=(',', ':'))) / 1024 / 1024
print(f"✅ Successfully saved {len(collisions):,} records")
print(f"📁 File size: {file_size:.2f} MB")

# Summary
print("\n📈 Final Summary:")
print(f"   • Years covered: {min(years)} - {max(years)}")
print(f"   • Total collisions: {len(collisions):,}")
print(f"   • Fatal: {sum(1 for c in collisions if c['sev']==2):,}")
print(f"   • With injuries: {sum(1 for c in collisions if c['sev']==1):,}")
print(f"   • Pedestrian: {sum(1 for c in collisions if c['ped']):,}")
print(f"   • Bicycle: {sum(1 for c in collisions if c['bike']):,}")
print(f"   • Impaired: {sum(1 for c in collisions if c['imp']):,}")
