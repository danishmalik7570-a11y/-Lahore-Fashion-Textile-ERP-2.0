"""
Bilingual Number to Words Engine (English & Urdu)
Supports standard international scale and South Asian (Lakh / Crore) scale.
"""
from decimal import Decimal
from typing import Union


class NumberToWordsService:
    ONES_EN = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ]
    TENS_EN = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ]

    ONES_UR = [
        "", "ایک", "دو", "تین", "چار", "پانچ", "چھ", "سات", "آٹھ", "نو",
        "دس", "گیارہ", "بارہ", "تیرہ", "چودہ", "پندرہ", "سولہ",
        "سترہ", "اٹھارہ", "انیس"
    ]
    TENS_UR = [
        "", "", "بیس", "تیس", "چالیس", "پچاس", "ساٹھ", "ستر", "اسی", "نوے"
    ]

    @classmethod
    def _convert_hundred_en(cls, n: int) -> str:
        if n == 0:
            return ""
        if n < 20:
            return cls.ONES_EN[n]
        if n < 100:
            ten = cls.TENS_EN[n // 10]
            one = cls.ONES_EN[n % 10]
            return f"{ten} {one}".strip()
        hundred = cls.ONES_EN[n // 100] + " Hundred"
        rest = cls._convert_hundred_en(n % 100)
        return f"{hundred} {rest}".strip()

    @classmethod
    def to_words_en(cls, amount: Union[int, float, Decimal], currency: str = "Rupees", use_lakh_crore: bool = True) -> str:
        """
        Converts decimal/int amount to English words.
        e.g. 1250000 -> "Rupees Twelve Lakh Fifty Thousand Only" (or One Million Two Hundred Fifty Thousand)
        """
        amt = Decimal(str(amount))
        int_part = int(amt)
        cents = int(round((amt - int_part) * 100))

        if int_part == 0:
            words = "Zero"
        elif use_lakh_crore:
            words = cls._to_words_lakh_crore(int_part)
        else:
            words = cls._to_words_western(int_part)

        cents_text = f" and {cents}/100" if cents > 0 else ""
        return f"{currency} {words}{cents_text} Only".strip()

    @classmethod
    def _to_words_lakh_crore(cls, n: int) -> str:
        if n == 0:
            return ""
        parts = []
        crore = n // 10000000
        n %= 10000000
        if crore > 0:
            parts.append(f"{cls._convert_hundred_en(crore)} Crore")

        lakh = n // 100000
        n %= 100000
        if lakh > 0:
            parts.append(f"{cls._convert_hundred_en(lakh)} Lakh")

        thousand = n // 1000
        n %= 1000
        if thousand > 0:
            parts.append(f"{cls._convert_hundred_en(thousand)} Thousand")

        if n > 0:
            parts.append(cls._convert_hundred_en(n))

        return " ".join(parts).strip()

    @classmethod
    def _to_words_western(cls, n: int) -> str:
        if n == 0:
            return ""
        parts = []
        billions = n // 1000000000
        n %= 1000000000
        if billions > 0:
            parts.append(f"{cls._convert_hundred_en(billions)} Billion")

        millions = n // 1000000
        n %= 1000000
        if millions > 0:
            parts.append(f"{cls._convert_hundred_en(millions)} Million")

        thousands = n // 1000
        n %= 1000
        if thousands > 0:
            parts.append(f"{cls._convert_hundred_en(thousands)} Thousand")

        if n > 0:
            parts.append(cls._convert_hundred_en(n))

        return " ".join(parts).strip()

    @classmethod
    def to_words_ur(cls, amount: Union[int, float, Decimal]) -> str:
        """
        Converts amount to Urdu text with Lakh/Crore.
        e.g. 1250000 -> 'بارہ لاکھ پچاس ہزار روپے فقط'
        """
        amt = Decimal(str(amount))
        int_part = int(amt)
        if int_part == 0:
            return "صفر روپے فقط"

        parts = []
        crore = int_part // 10000000
        int_part %= 10000000
        if crore > 0:
            parts.append(f"{cls._convert_hundred_ur(crore)} کروڑ")

        lakh = int_part // 100000
        int_part %= 100000
        if lakh > 0:
            parts.append(f"{cls._convert_hundred_ur(lakh)} لاکھ")

        thousand = int_part // 1000
        int_part %= 1000
        if thousand > 0:
            parts.append(f"{cls._convert_hundred_ur(thousand)} ہزار")

        if int_part > 0:
            parts.append(cls._convert_hundred_ur(int_part))

        urdu_body = " ".join(parts).strip()
        return f"{urdu_body} روپے فقط"

    @classmethod
    def _convert_hundred_ur(cls, n: int) -> str:
        if n == 0:
            return ""
        if n < 20:
            return cls.ONES_UR[n]
        if n < 100:
            ten = cls.TENS_UR[n // 10]
            one = cls.ONES_UR[n % 10]
            if one:
                return f"{one} اور {ten}"
            return ten
        hundred = cls.ONES_UR[n // 100] + " سو"
        rest = cls._convert_hundred_ur(n % 100)
        if rest:
            return f"{hundred} {rest}"
        return hundred
