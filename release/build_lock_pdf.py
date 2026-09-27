from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, KeepTogether
from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
pdfmetrics.registerFont(TTFont('ShiftSans','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('ShiftSansBold','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
source=(root/'release'/'MEDICINE_FRONT_DOOR_RELEASE_NOTES.md').read_text(encoding='utf-8')
out=root/'output'/'pdf'/'MEDICINE_FRONT_DOOR_SUPERSEDING_BUILD_LOCK_2026-09-05.pdf'
out.parent.mkdir(parents=True,exist_ok=True)
styles=getSampleStyleSheet()
styles.add(ParagraphStyle(name='TitleShift',parent=styles['Title'],fontName='ShiftSansBold',fontSize=25,leading=28,textColor=colors.HexColor('#10130f'),spaceAfter=8))
styles.add(ParagraphStyle(name='H2Shift',parent=styles['Heading2'],fontName='ShiftSansBold',fontSize=16,leading=19,textColor=colors.HexColor('#59604d'),spaceBefore=13,spaceAfter=7))
styles.add(ParagraphStyle(name='H3Shift',parent=styles['Heading3'],fontName='ShiftSansBold',fontSize=12,leading=15,textColor=colors.HexColor('#a4432d'),spaceBefore=10,spaceAfter=5))
styles.add(ParagraphStyle(name='BodyShift',parent=styles['BodyText'],fontName='ShiftSans',fontSize=9.6,leading=14,spaceAfter=6))
styles.add(ParagraphStyle(name='BulletShift',parent=styles['BodyText'],fontName='ShiftSans',fontSize=9.4,leading=13.5,leftIndent=13,firstLineIndent=-7,spaceAfter=4))
styles.add(ParagraphStyle(name='MetaShift',parent=styles['BodyText'],fontName='ShiftSansBold',fontSize=9.3,leading=13,textColor=colors.HexColor('#59604d'),spaceAfter=3))

def clean_inline(s):
    s=re.sub(r'\*\*(.+?)\*\*',r'<b>\1</b>',s)
    s=re.sub(r'`(.+?)`',r'<font name="Courier">\1</font>',s)
    return s

story=[]
for raw in source.splitlines():
    line=raw.strip()
    if not line: story.append(Spacer(1,3)); continue
    if line.startswith('# '): story.append(Paragraph(clean_inline(line[2:]),styles['TitleShift']))
    elif line.startswith('## '): story.append(Paragraph(clean_inline(line[3:]),styles['H2Shift']))
    elif line.startswith('### '): story.append(Paragraph(clean_inline(line[4:]),styles['H3Shift']))
    elif line.startswith('- '): story.append(Paragraph('• '+clean_inline(line[2:]),styles['BulletShift']))
    elif re.match(r'^\d+\. ',line): story.append(Paragraph(clean_inline(line),styles['BulletShift']))
    elif line.startswith('**'): story.append(Paragraph(clean_inline(line.replace('  ',' ')),styles['MetaShift']))
    else: story.append(Paragraph(clean_inline(line),styles['BodyShift']))

def footer(canvas,doc):
    canvas.saveState(); canvas.setStrokeColor(colors.HexColor('#cbc6b9')); canvas.line(18*mm,14*mm,192*mm,14*mm)
    canvas.setFont('ShiftSans',8); canvas.setFillColor(colors.HexColor('#59604d')); canvas.drawString(18*mm,9*mm,'SHIFT SOME TIMBER · MEDICINE FRONT DOOR · STAGING LOCK')
    canvas.drawRightString(192*mm,9*mm,f'{doc.page}'); canvas.restoreState()

doc=SimpleDocTemplate(str(out),pagesize=A4,rightMargin=18*mm,leftMargin=18*mm,topMargin=18*mm,bottomMargin=20*mm,title='Medicine Front Door - Superseding Build Lock',author='Shift Some Timber')
doc.build(story,onFirstPage=footer,onLaterPages=footer)
print(out)
