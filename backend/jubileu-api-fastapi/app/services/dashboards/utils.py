from datetime import date, timedelta


ALLOWED_PERIODS = {30, 90, 365}


def normalize_period(period: int | None) -> int:
    if period in ALLOWED_PERIODS:
        return int(period)  # type: ignore[arg-type]
    return 30


def cutoff_date(period: int) -> date:
    return date.today() - timedelta(days=period)
