#!/usr/bin/env python3
"""
Sözleşme denetimi: firmware ile web aynı kelimeleri mi kullanıyor?

Cihaz "sleeping" derken web "asleep" bekliyorsa hiçbir test patlamaz — sadece
Elçin bir uçta uyur, diğer uçta uyumaz. Bu betik iki taraftaki ad listelerini
karşılaştırır ve fark varsa hata döndürür.

    python3 esp32/tools/check_contract.py        (elcin-src dizininden)
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB_TYPES = ROOT / 'frontend' / 'src' / 'types' / 'index.ts'
FW_STATE = ROOT / 'esp32' / 'src' / 'core' / 'DeviceState.cpp'
FW_FACE = ROOT / 'esp32' / 'src' / 'core' / 'FaceEngine.cpp'
FW_ANIM = ROOT / 'esp32' / 'src' / 'core' / 'AnimationEngine.cpp'
FW_TOUCH = ROOT / 'esp32' / 'src' / 'core' / 'TouchRecognizer.cpp'


def web_union(source: str, name: str) -> set:
    """export const MOODS = [ 'a', 'b' ] as const;  → {'a','b'}"""
    match = re.search(rf'export const {name} = \[(.*?)\] as const;', source, re.S)
    if not match:
        raise SystemExit(f'web tarafinda {name} bulunamadi')
    return set(re.findall(r"'([a-z_]+)'", match.group(1)))


def web_inline_union(source: str, name: str) -> set:
    """export type TouchGesture = | 'a' | 'b';  → {'a','b'}"""
    match = re.search(rf'export type {name} =(.*?);', source, re.S)
    if not match:
        raise SystemExit(f'web tarafinda {name} bulunamadi')
    return set(re.findall(r"'([a-z_]+)'", match.group(1)))


def firmware_returns(path: Path, function: str) -> set:
    """const char* f(...) { switch ... return "x"; }  → {'x'}"""
    source = path.read_text(encoding='utf-8')
    match = re.search(rf'const char\* {function}\([^)]*\)\s*{{(.*?)\n}}', source, re.S)
    if not match:
        raise SystemExit(f'firmware tarafinda {function} bulunamadi')
    names = set(re.findall(r'return "([a-z_]+)";', match.group(1)))
    names.discard('none')   # Gesture::None protokolde yok
    names.discard('?')
    return names


def compare(label: str, web: set, firmware: set) -> bool:
    if web == firmware:
        print(f'  OK    {label:12} ({len(web)} deger)')
        return True

    print(f'  FARK  {label}')
    if web - firmware:
        print(f'        yalnizca web:      {sorted(web - firmware)}')
    if firmware - web:
        print(f'        yalnizca firmware: {sorted(firmware - web)}')
    return False


def main() -> None:
    types = WEB_TYPES.read_text(encoding='utf-8')
    print('\nWeb <-> firmware sozlesme denetimi\n')

    ok = True
    ok &= compare('mood', web_union(types, 'MOODS'),
                  firmware_returns(FW_FACE, 'moodName'))
    ok &= compare('animation', web_union(types, 'ANIMATIONS'),
                  firmware_returns(FW_ANIM, 'animationName'))
    ok &= compare('state', web_union(types, 'DEVICE_STATES'),
                  firmware_returns(FW_STATE, 'stateWireName'))
    ok &= compare('touch', web_inline_union(types, 'TouchGesture'),
                  firmware_returns(FW_TOUCH, 'gestureName'))

    print()
    if not ok:
        print('Iki uc ayni kelimeleri kullanmiyor.\n')
        sys.exit(1)
    print('Iki uc ayni dili konusuyor.\n')


if __name__ == '__main__':
    main()
