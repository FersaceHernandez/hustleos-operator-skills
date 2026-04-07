---
name: trading-bot-lab
description: Use when designing, testing, or refining a trading or prediction-market bot. Best for strategy selection, data sources, paper trading, risk limits, logging, deployment order, and avoiding fake backtest confidence.
---

# Trading Bot Lab

Use this skill to keep bot work grounded in reality.

## Trigger on requests like

- build this bot
- test this strategy
- what should we trade first
- is this bot viable
- paper trade this before going live
- what data sources do we need

## Goal

Move from idea to validated system in the safest order.

## Workflow

1. Name the market and venue.
2. Define the edge hypothesis.
3. Define the data inputs.
4. Define the execution style.
5. Define the risk limits.
6. Paper trade before live capital.
7. Log every signal, trade, and outcome.

## Output format

Return:
- **Strategy**
- **Why edge might exist**
- **Data needed**
- **MVP architecture**
- **Risk rules**
- **Paper-trade plan**
- **Go-live gate**

## Rules

- Assume backtests are lying until live behavior proves otherwise.
- Small capital means validation first, income second.
- Slippage, fees, and downtime count.
- Prefer simple systems that can be monitored.
- Do not recommend live deployment before paper logs look sane.
