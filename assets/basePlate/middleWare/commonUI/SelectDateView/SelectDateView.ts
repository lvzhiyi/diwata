import { _decorator, Component, Node, Label, log, color, Button, Sprite, EventTouch, UITransform, Color } from 'cc';

const { ccclass, property } = _decorator;

export enum SelectDateType {
    Single = 0,         // 当天的
    Designated,         // 指定N-M天
}

@ccclass('SelectDateView')
export class SelectDateView extends Component {
    @property(Button)
    private leftButton: Button | null = null;

    @property(Button)
    private rightButton: Button | null = null;

    @property(Label)
    private yearLabel: Label | null = null;

    @property(Label)
    private monthLabel: Label | null = null;

    @property(Node)
    private selectDateLayout: Node | null = null;

    @property({
      type: Color, displayName: 'todayColor', tooltip: '今天日期颜色' 
    })
    private readonly todayColor: Color | null = color(235, 180, 85);

    @property({
      type: Color, displayName: 'normalColor', tooltip: '正常日期颜色' 
    })
    private readonly normalColor: Color | null = color(135, 100, 45);

    @property({
      type: Color, displayName: 'ashColor', tooltip: '置灰日期颜色' 
    })
    private readonly ashColor: Color | null = color(190, 165, 125);

    @property(Node)
    private scrollView: Node | null = null;

    @property(Node)
    private scrollViewContent: Node | null = null;
    
    private _dateList: Date[] = [];              // 日期列表

    private _selectDateList: Date[] = [];        // 选择中的日期范围列表

    private _selectMonthDate: Date | null = null;// 选择月份日期

    private _currentDate: Date | null = null;    // 今天日期

    private _minSelectDate: Date | null = null;  // 最小可选日期

    private _onSelectComplete?: Function;        // 选择日期完成回调

    private _selectDateType: SelectDateType | null = null; // 选择日期类型   

    private _selectYears: number[] = [];           // 选择年份列表

    onLoad(){
      // this.node.active = false;
      if (this.leftButton) this.leftButton.node.on('click', this.onLeftButtonClick, this);
      if (this.rightButton) this.rightButton.node.on('click', this.onRightButtonClick, this);

      for (let i = 0; i < this.selectDateLayout.children.length; i++) {
        const item = this.selectDateLayout.children[i];
        item.on('click', this.onDayClick, this);
      }

      this.scrollViewContent?.children.forEach(item => {
        item.on('click', this.onSelectYearClick, this);
      });
     
      this.scrollViewContent?.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
      this.scrollViewContent?.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
      this.scrollViewContent?.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
      this.scrollViewContent?.on(Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
   
      this.node.on(Node.EventType.TOUCH_END, () => {
        // 禁止点击穿透
      }, this);
    }

    /**
     * 选择指定日期
     * @param date  今天日期
     * @param onComplete  选择完成回调 --返回参数类型 Date[]   
     * @param selectDateType  选择日期类型 SelectDateType.Single 当天，SelectDateType.Designated 指定的N-M天
     * @param optionalDays 今天到过去第N 天
     */
    public show(date: Date, onComplete: Function, selectDateType = SelectDateType.Single, optionalDays = 30){
      this.node.active = true;

      if (!date) {
        date = new Date();
      }

      this._currentDate = date;
      this._onSelectComplete = onComplete;
      this._minSelectDate = this.getDates(date, -optionalDays);
      this._selectDateType = selectDateType;
      this._selectDateList = [];
      this.initSelectYearList();
      this.updateUI(date);
    }

    /** 隐藏日期 */
    public hide(){
      this.node.active = false;
    }
    
    //* * 更新日期UI */
    private updateUI(date: Date){
      this._selectMonthDate = date;
      this.yearLabel.string = date.getFullYear().toString();
      const months: string[] = [
        'January', 
        'February', 
        'March', 
        'April', 
        'May', 
        'June', 
        'July', 
        'August', 
        'September', 
        'October', 
        'November', 
        'December'
      ];
      this.monthLabel.string = months[date.getMonth()];
      let weekIndex = this.getFirstDayOfWeek(date);
      let currentMaxDay = this.getLastDayOfCurrentMonth(date);
      let lastMonthMaxDay = this.getLastDayOfPreviousMonth(date);

      this._dateList = [];

      for (let i = 0; i < this.selectDateLayout.children.length; i++) {
        const item = this.selectDateLayout.children[i];
        let textLabel =  item.getChildByName('Text').getComponent(Label);
        item.getChildByName('Select').active = false; 
        item.getChildByName('Disable').active = false;

        // 上一个月显示
        if (i < weekIndex) {
          const lastMonthDay = i + 1 + lastMonthMaxDay - weekIndex;
          textLabel.string = lastMonthDay.toString();
          textLabel.color = this.ashColor;
          item.getComponent(Button).interactable = false;

          const everyDayDate = new Date(date.getFullYear(), date.getMonth() - 1, lastMonthDay);

          if (everyDayDate > this._minSelectDate && everyDayDate < this._currentDate) {
            textLabel.color = this.normalColor;
            item.getComponent(Button).interactable = true;
          }

          this._dateList.push(everyDayDate);
          this.updateSelectDate(everyDayDate, item);
        }

        // 当前月显示
        if (i >= weekIndex  && i < currentMaxDay + weekIndex) {
          const day = i + 1 - weekIndex;
          textLabel.string = day.toString();
          textLabel.color = this.normalColor;
          item.getComponent(Button).interactable = true;

          if (this.isSameDay(date, this._currentDate) && day == this._currentDate.getDate()) {
            console.log(this.todayColor);
                    
            textLabel.color = this.todayColor;
          }

          const everyDayDate = new Date(date.getFullYear(), date.getMonth(), day);

          if (everyDayDate > this._currentDate) {
            textLabel.color = this.ashColor;
            item.getComponent(Button).interactable = false;
            // item.getChildByName("Disable").active = true;
          }else{
            item.getComponent(Button).interactable = true;
            // item.getChildByName("Disable").active = false;
          }
     
          if (everyDayDate < this._minSelectDate) {
            textLabel.color = this.ashColor;
            item.getComponent(Button).interactable = false;
          }

          this._dateList.push(everyDayDate);
          this.updateSelectDate(everyDayDate, item);
        }

        // 下一个月显示
        if (i >= currentMaxDay + weekIndex ) {
          let nextMonthDay = i - currentMaxDay - weekIndex + 1;
          textLabel.getComponent(Label).string = (nextMonthDay).toString(); 
          textLabel.color = this.ashColor;
          item.getComponent(Button).interactable = false;
          // item.getChildByName("Disable").active = true;

          const everyDayDate = new Date(date.getFullYear(), date.getMonth() + 1, nextMonthDay);

          if (everyDayDate > this._minSelectDate && everyDayDate < this._currentDate) {
            textLabel.color = this.normalColor;
            item.getComponent(Button).interactable = true;
            // item.getChildByName("Disable").active = false;
          }
          if (this.isSameDay(everyDayDate, this._currentDate)) {
            textLabel.color = this.todayColor;
          }

          this._dateList.push(everyDayDate);
          this.updateSelectDate(everyDayDate, item);
        }
      }
    }

    /** 更新选中天数显示 */
    private updateSelectDate(everyDayDate: Date, item: Node){
      this._selectDateList.forEach(selectDate => {
        if (this.isSameDay(everyDayDate, selectDate)) {
          item.getChildByName('Select').active = true; 
          item.getChildByName('Text').getComponent(Label).color = color(255, 255, 255);
        }
      });
    }

    /** 天数点击 */
    private onDayClick(event: any){
      if (this._selectDateType == SelectDateType.Single && this._selectDateList.length >= 1 || this._selectDateType == SelectDateType.Designated && this._selectDateList.length >= 2) {
        return;
      }

      this._selectDateList.push(this._dateList[event.target.getSiblingIndex()]);
        
      if (this._selectDateList.length == 2) {
        if (this._selectDateList[0] > this._selectDateList[1]) {
          let temp = this._selectDateList[1];
          this._selectDateList[1] = this._selectDateList[0];
          this._selectDateList[0] = temp;
        }
      }

      this.updateUI(this._selectMonthDate);
 
      if (this._selectDateType == SelectDateType.Single && this._selectDateList.length >= 1 || this._selectDateType == SelectDateType.Designated && this._selectDateList.length >= 2) {
        this.scheduleOnce(this.hide, 0.2 );
      }

      this.processingResults();
    }

    /** 上一个月按钮点击 */
    private onLeftButtonClick(){
      let lastMonth = new Date(
        this._selectMonthDate.getFullYear(),  this._selectMonthDate.getMonth() - 1, 1);
      this.updateUI(lastMonth);
      this.rightButton.interactable = true;
      this.rightButton.node.getChildByName('Icon').getComponent(Sprite).grayscale = false;
    }

    /** 下一个月按钮点击 */
    private onRightButtonClick(){
      let nextMonth = new Date(
        this._selectMonthDate.getFullYear(), this._selectMonthDate.getMonth() + 1, 1);
      console.log(nextMonth);
            
      this.updateUI(nextMonth);

      if (this.isSameMonth(this._currentDate, nextMonth)) {
        this.rightButton.interactable = false;
        this.rightButton.node.getChildByName('Icon').getComponent(Sprite).grayscale = true;
      }
    }

    /**                ----------------------------------选中年份滚动事件处理-------------------------------                  */

    private _moveDistance: number = 0;
        
    private onTouchStart(event: EventTouch){
      this.scrollViewContent.setPosition(this.scrollViewContent.position.x, this.scrollViewContent.position.y + event.getDeltaY());
      this._moveDistance = 0;
    }

    private onTouchMove(event: EventTouch){
      this.scrollViewContent.setPosition(this.scrollViewContent.position.x, this.scrollViewContent.position.y + event.getDeltaY());
      this._moveDistance += event.getDeltaY();

      if (this._moveDistance >= this.scrollViewContent.getComponent(UITransform).height / this.scrollViewContent.children.length && this._selectYears[this._selectYears.length - 1] == this._currentDate.getFullYear() + 1) {
        this.scrollViewContent.children[this.scrollViewContent.children.length - 1].active = false;
      }

      if (this._moveDistance >= this.scrollViewContent.getComponent(UITransform).height / this.scrollViewContent.children.length && this._selectYears[this._selectYears.length - 1] < this._currentDate.getFullYear() + 1) {
        this.scrollViewContent.setPosition(0, 0, 0);
        this._moveDistance  = 0;
        this.scrollViewContent.children[this.scrollViewContent.children.length - 1].active = true;
        this._selectYears.splice(0, 1);
        this._selectYears.push(this._selectYears[this._selectYears.length - 1] + 1);
        this.updateSelectYearList(this._selectYears);
      }else if (this._moveDistance < 0 && this.scrollViewContent.position.y < 0) {
        this.scrollViewContent.setPosition(0, this.scrollViewContent.getComponent(UITransform).height / this.scrollViewContent.children.length, 0);
        this._moveDistance  = 0;
        this.scrollViewContent.children[this.scrollViewContent.children.length - 1].active = true;
        this._selectYears.splice(this._selectYears.length - 1, 1);
        let newYear = this._selectYears[0] - 1 == 0 ? this._currentDate.getFullYear() : this._selectYears[0] - 1;
        this._selectYears.unshift(newYear);
        this.updateSelectYearList(this._selectYears);
      }
    }

    private onTouchEnd(event: EventTouch){
      if (this._moveDistance > 0 && this._moveDistance > 30) {
        this.scrollViewContent.setPosition(0, 0, 0);
        this._moveDistance  = 0;
      }
    }

    private initSelectYearList(){
      this._selectYears = [];

      for (let i = 0; i < this.scrollViewContent?.children.length; i++) {
        const year =  this._currentDate.getFullYear() + (i - this.scrollViewContent.children.length) +  2 ;
        this._selectYears.push(year);
      }

      this.updateSelectYearList(this._selectYears);
    }

    private updateSelectYearList(selectYears: number[]){
      selectYears.forEach((year, index) => {
        const item = this.scrollViewContent?.children[index];
        item.getComponent(Label).string = year.toString();
      });
    }

    /** 选中年份点击 */
    private onSelectYearClick(event: EventTouch){
      const year = this._selectYears[event.target.getSiblingIndex()];
      let selectYear = new Date(
        year,  this._selectMonthDate.getMonth(), 1);
      this.updateUI(selectYear);
      this.scrollView.active = false;
      this.yearLabel.string = year.toString();

      if (this.isSameMonth(this._currentDate, selectYear)) {
        this.rightButton.interactable = false;
        this.rightButton.node.getChildByName('Icon').getComponent(Sprite).grayscale = true;
      }else{
        this.rightButton.interactable = true;
        this.rightButton.node.getChildByName('Icon').getComponent(Sprite).grayscale = false;
      }
    }

    private showYearScrollView(event: EventTouch){
      this.scrollView.active = true;
    }

    private hideYearScrollView(event: EventTouch){
      this.scrollView.active = false;
    }

    /**  获取当月第一天是星期几 // 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
    private getFirstDayOfWeek(now: Date): number {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

      return dayOfWeek;
    }

    /** 获取当前月份的最大一天 */
    private getLastDayOfCurrentMonth(now: Date): number {
      // 设置为下个月的第一天，然后减去一天
      const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      return lastDayOfCurrentMonth.getDate(); // 获取日期
    }

    /** 获取上个月的最后一天 */
    private getLastDayOfPreviousMonth(now: Date): number {
      // 设置为上一个月
      const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      return previousMonth.getDate();
    }

    /** 是否是同一天 */
    private isSameDay(date1: Date, date2: Date): boolean {
      return (
        date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getDate() === date2.getDate()
      );
    }

    /** 是否是同一个月 */
    private isSameMonth(date1: Date, date2: Date): boolean {
      return (
        date1.getFullYear() === date2.getFullYear() &&
            date1.getMonth() === date2.getMonth() 
      );
    }

    /** 获取N天后的日期 */
    private getDates(currentDate: Date, N: number) {
      // N天后的日期
      const futureDate = new Date(currentDate);
      futureDate.setDate(currentDate.getDate() + N);

      return futureDate;
    }

    onDestroy(){
      // this.processingResults();
    }

    onDisable(){
      // this.processingResults();
    }

    private processingResults(){
      if (this._selectDateType == SelectDateType.Single && this._selectDateList.length == 0) {
        this._selectDateList.push(this._currentDate);
      }

      if (this._selectDateType == SelectDateType.Designated) {
        if (this._selectDateList.length == 0) {
          this._selectDateList.push(this._currentDate);
          this._selectDateList.push(this._currentDate);
        }else if (this._selectDateList.length == 1) {
          this._selectDateList.push(this._currentDate);
        }
        if (this._selectDateList[0] > this._selectDateList[1]) {
          let temp = this._selectDateList[1];
          this._selectDateList[1] = this._selectDateList[0];
          this._selectDateList[0] = temp;
        }
      }

      this._onSelectComplete && this._onSelectComplete(this._selectDateList);
    }
}
