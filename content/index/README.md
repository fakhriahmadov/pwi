# EuroCapital Index data

Two CSV files feed the Research page. Replace them with each new edition; the site rebuilds from them.

`series.csv`: the index over time
```
date,value
2024-01-01,100
```

`ranking.csv`: one row per country for the latest edition
```
edition,country,billionaires,wealth_eur_bn,change_pct,leading_industry
2026,Spain,0,0,0,Retail
```

Header-only files show a "first edition coming soon" state on the site.
