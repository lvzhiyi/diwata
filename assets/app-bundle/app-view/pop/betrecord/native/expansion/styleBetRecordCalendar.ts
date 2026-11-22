import { Button, Color, EditBox, Graphics, Label, Layout, Node, Sprite, UITransform, Vec3, Widget } from 'cc';

const blue = '#084EB2';
export const calendarRows = (date: Date) => Math.ceil((new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  + new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()) / 7);

function size(node: Node, width: number, height: number) {
  node.getComponent(UITransform).setContentSize(width, height);
}

function graphics(node: Node) {
  const sprite = node.getComponent(Sprite);
  if (sprite) sprite.enabled = false;
  let drawing = node.getChildByName('CalendarDrawing');
  if (!drawing) {
    drawing = new Node('CalendarDrawing');
    drawing.layer = node.layer;
    node.insertChild(drawing, 0);
    drawing.addComponent(Graphics);
  }
  return drawing.getComponent(Graphics);
}

function rounded(g: Graphics, x: number, y: number, width: number, height: number, radius: number, fill: string) {
  g.fillColor = new Color().fromHEX(fill);
  g.roundRect(x, y, width, height, radius);
  g.fill();
}

export const BET_RECORD_CARD = { width: 682, height: 296, top: 417 };
export const BET_RECORD_FILTER = { width: 681, height: 58, top: 137, gap: 30, field: 277, button: 108, tab: 158 };

export function styleBetRecordLayout(back: Node, tabs: Node, dateLabel: Node, round: Node, list: Node) {
  const { width, height, top, gap, field, button, tab } = BET_RECORD_FILTER;
  const nav = back.parent;
  size(nav, 750, 114);
  const header = nav.getChildByName('Title');
  header.getComponent(Widget).enabled = false;
  header.setPosition(0.5, 0);
  const title = header.getComponent(Label);
  title.fontSize = 48;
  title.lineHeight = 58;
  back.getComponent(Widget).enabled = false;
  size(back, 50, 50);
  back.setPosition(-300, 0);
  const backImage = back.children.find(child => child.getComponent(Sprite));
  if (backImage) {
    backImage.getComponent(Sprite).sizeMode = Sprite.SizeMode.CUSTOM;
    size(backImage, 58, 58);
  }

  const filters = list.parent;
  filters.getComponent(Widget).top = 114;
  const stack = filters.getComponent(Layout);
  stack.paddingTop = top - 114;
  stack.spacingY = gap;
  const dateField = dateLabel.parent;
  const roundField = round.parent;
  const quick = tabs.parent;
  for (const row of [quick, dateField.parent, roundField.parent]) {
    row.getComponent(Layout).enabled = false;
    size(row, width, height);
    const caption = row.children[0];
    caption.setPosition(-340, 0);
    const label = caption.children[0].getComponent(Label);
    label.fontSize = 30;
    label.lineHeight = row === roundField.parent ? 22 : 36;
  }
  tabs.getComponent(Widget).enabled = false;
  tabs.getComponent(Layout).enabled = false;
  tabs.setPosition(0, 0);
  tabs.children.forEach((node, i) => {
    // Keep the 4 px of shadow around the 158 × 58 button face.
    size(node, tab + 8, height + 8);
    node.setPosition(-93 + 177 * i, -0.5);
    const label = node.children[0].getComponent(Label);
    label.string = ['15 mins', '30 mins', '1 hour'][i];
    label.fontSize = 26;
    label.lineHeight = 35;
  });
  for (const input of [dateField, roundField]) {
    const row = input.parent;
    size(input, field, height);
    input.setPosition(-33.5, 0);
    row.getChildByName('EmptyNode').active = false;
    for (const [name, x, tint] of [['SearchIcon', 169, '#FFFFFF'], ['DeleteIcon', 287, '#040773']] as const) {
      const node = row.getChildByName(name);
      size(node, button + 8, height + 8);
      node.setPosition(x, -0.5);
      const label = node.getChildByName('Label').getComponent(Label);
      label.fontSize = 22;
      label.lineHeight = 27;
      label.color = new Color().fromHEX(tint);
    }
  }
  const dateText = dateLabel.getComponent(Label);
  dateLabel.getComponent(UITransform).setAnchorPoint(0, 0.5);
  dateLabel.setPosition(-124.5, 0);
  dateText.fontSize = 20;
  dateText.lineHeight = 24;
  dateText.color = new Color().fromHEX('#8EADC8');

  size(roundField.getChildByName('Border'), field, height);
  // EditBox adds 2 px internally; inset its node by another 12 px on the left.
  size(round, field - 24, height);
  const edit = round.getComponent(EditBox);
  for (const label of [edit.textLabel, edit.placeholderLabel]) {
    label.horizontalAlign = Label.HorizontalAlign.LEFT;
    label.fontSize = 20;
    label.lineHeight = 24;
  }
  edit.placeholderLabel.color = new Color().fromHEX('#8EADC8');

  const listWidget = list.getComponent(Widget);
  // Match the stack's list position so Widget and Layout agree after a resize.
  const listTop = top + 3 * (height + gap);
  listWidget.top = listTop - 114;
  listWidget.left = listWidget.right = 0;
  const cardStack = list.getChildByName('view').getChildByName('content').getComponent(Layout);
  cardStack.paddingTop = BET_RECORD_CARD.top - listTop;
  cardStack.spacingY = 28;
}

export function styleBetRecordCalendar(calendar: Node, field: Node, date: Date) {
  const rows = calendarRows(date);
  const gridHeight = 213 + (rows - 5) * 41;
  const height = 115 + gridHeight;
  const half = height / 2;
  const panel = calendar.getChildByName('Content');
  const top = panel.getChildByName('Top');
  const week = top.getChildByName('WeekLayout');
  const title = top.getChildByName('TitleLayout');
  const grid = panel.getChildByName('SelectDateLayout');
  calendar.getComponent(Widget).enabled = false;
  calendar.getChildByName('Bg').active = false;
  panel.getChildByName('ScrollView').active = false;

  size(calendar, 395, height);
  size(panel, 395, height);
  const fieldTransform = field.getComponent(UITransform);
  const world = fieldTransform.convertToWorldSpaceAR(new Vec3(-fieldTransform.width / 2, -fieldTransform.height / 2));
  const anchor = calendar.parent.getComponent(UITransform).convertToNodeSpaceAR(world);
  calendar.setPosition(anchor.x + 197.5, anchor.y - 4 - half);

  const panelGraphics = graphics(panel);
  panelGraphics.clear();
  for (let spread = 10; spread >= 1; spread--) {
    rounded(panelGraphics, -197.5 - spread, -half - spread, 395 + 2 * spread, height + 2 * spread, 18 + spread, '#C8DEF412');
  }
  rounded(panelGraphics, -197.5, -half, 395, height, 18, '#D0EBFD');
  rounded(panelGraphics, -195.5, -half + 2, 391, height - 4, 16, '#FFFFFF');
  rounded(panelGraphics, -187.5, -half + 10, 375, gridHeight, 12, '#ECF6FE');

  top.getComponent(Widget).enabled = false;
  size(top, 395, 50);
  top.setPosition(0, half - 41.5);
  title.getComponent(Layout).spacingX = 12;
  for (const child of title.children) {
    child.getComponent(Button).enabled = false;
    const label = child.getComponent(Label);
    label.fontSize = 26;
    label.lineHeight = 31;
    label.isBold = false;
    label.color = new Color().fromHEX(blue);
  }
  const columnX = [-154, -99, -44, 10, 66, 114, 158];
  week.getComponent(Widget).enabled = false;
  week.getComponent(Layout).enabled = false;
  week.setPosition(0, -41.5);
  week.children.forEach((child, i) => {
    child.setPosition(columnX[i], 0);
    const label = child.getComponent(Label);
    label.fontSize = 20;
    label.lineHeight = 24;
    label.isBold = false;
    label.color = new Color().fromHEX(blue);
  });
  for (const [name, x, direction] of [['LeftArrowButton', -155.5, -1], ['RightArrowButton', 168.5, 1]] as const) {
    const button = top.getChildByName(name);
    button.getComponent(Widget).enabled = false;
    button.setPosition(x, 0);
    const g = graphics(button.getChildByName('Icon'));
    g.clear();
    g.strokeColor = new Color().fromHEX(button.getComponent(Button).interactable ? blue : '#A0B2C9');
    g.lineWidth = 2.75;
    g.moveTo(-5 * direction, 9);
    g.lineTo(5 * direction, 0);
    g.lineTo(-5 * direction, -9);
    g.stroke();
  }
  grid.getComponent(Layout).enabled = false;
  size(grid, 375, gridHeight);
  grid.setPosition(0, half - 105 - gridHeight / 2);
  grid.children.forEach((day, i) => {
    day.active = i < rows * 7;
    if (!day.active) return;
    const row = Math.floor(i / 7);
    const col = i % 7;
    const hitWidth = col === 0 || col === 6 ? 42 : Math.min(columnX[col] - columnX[col - 1], columnX[col + 1] - columnX[col]);
    size(day, hitWidth, 41);
    day.setPosition(columnX[col], gridHeight / 2 - 25 - 41 * row);
    day.getChildByName('Text').getComponent(Label).isBold = false;
    const selection = day.getChildByName('Select');
    selection.getComponent(Sprite).enabled = false;
    if (selection.active) {
      panelGraphics.fillColor = new Color().fromHEX('#0485FD');
      panelGraphics.circle(columnX[col], half - 130 - 41 * row, 19);
      panelGraphics.fill();
    }
  });
}
