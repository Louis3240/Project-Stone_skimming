//漣漪效果的動畫(來源：https://code.almeros.com/water-ripple-canvas-and-javascript/)
var pixel = create2DArray(createRadialCanvas(2, 2));
var raindrop = create2DArray(createRadialCanvas(4, 4));
var finger = create2DArray(createRadialCanvas(50, 50));

var width = 288;
var height = 512;

function init() {
    // Init the basic components
    var waterModel = new WaterModel(width, height, {
        resolution: 3.0,
        interpolate: false,
        damping: 0.985,
        clipping: 5,
        evolveThreshold: 0.05,
        maxFps: 50,
        showStats: true
    });
    var waterCanvas = new WaterCanvas(width, height, "waterHolder", waterModel, {
        backgroundImageUrl: null,
        lightRefraction: 9.0,
        lightReflection: 0.1,
        showStats: true
    });


    // Init some utils
    var rainMaker = new RainMaker(width, height, waterModel, raindrop);
    rainMaker.setRaindropsPerSecond(0);

    // enableMouseInteraction(waterModel, "myCanvas");

    var array2d = [
        [0.5, 1.0, 0.5],
        [1.0, 1.0, 1.0],
        [0.5, 1.0, 0.5]
    ];


    // 以下是自己的project

    //Canvas起手
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");

    // 石頭的屬性
    var stone = {
        X: 144,
        Y: 400,
        LowY: 400,  //最低點
        TopY: 380,  //最高點
        TemperY: 280,   //依照點擊改動最高點的暫存
        ClickFlag: true,  //是否可以點擊的判斷
        Accelerate: 1,   //最佳時間點點可減緩減速
        RX: 30,
        RY: 20,
        VX: 0,
        VY: 0,  //決定石頭浮動速率
        VZ: 0,  //石頭剛開始出去的移動速率
    };

    // 做一個全域變數，方便在各個函式裡使用。因為要判斷石頭落水後，減速，但是事實上是背景在動。
    var moveSpeed = 2;

    //再做一個結束遊戲前石頭沉沒的flag
    var endFlag = false;

    //真的結束遊戲的flag
    var overFlag = false;

    //全域變數距離跟彈跳數，不會被重新宣告
    var dist = 0;
    var bounce = 0;

    //量表1箭頭的變數，宣告在裡面失敗了(函數包函數)
    var arrow1x = 35;
    const arrow1StandardVx = 6;
    var arrow1Vx = 10;
    var arrow1y = 430;
    var arrow1Direction = true;

    //畫個石頭
    function drawStone(scale) {

        // 畫陰影或反射(一接觸水面時消失)
        if (stone.Y >= stone.TopY && stone.Y <= stone.LowY) {
            ctx.beginPath();
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = "grey";
            ctx.ellipse(stone.X + 10, stone.Y + 10, stone.RX * (0.9 - scale), stone.RY * (0.9 - scale), 0, 0, Math.PI * 2);
            ctx.fill();
        }


        //真的石頭
        ctx.beginPath();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "grey";
        ctx.ellipse(stone.X, stone.Y, stone.RX * (1 + scale), stone.RY * (1 + scale), 0, 0, Math.PI * 2);
        ctx.fill();

    }

    //石頭彈跳量表
    function pressBar() {
        //量表上下兩條白線
        ctx.beginPath();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "white";
        ctx.moveTo(230, 270);
        ctx.lineTo(280, 270);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(230, 320);
        ctx.lineTo(280, 320);
        ctx.stroke();

        //漸層塗量表
        ctx.globalAlpha = 0.9;
        var lineargradient = ctx.createLinearGradient(245, 270, 245, 320);
        lineargradient.addColorStop(0, 'white');
        lineargradient.addColorStop(0.6, 'green');
        lineargradient.addColorStop(1, 'red');
        ctx.fillStyle = lineargradient;
        ctx.fillRect(245, 270, 20, 50);

        //游標怎麼跑
        ctx.beginPath()
        ctx.fillStyle = "white";
        ctx.ellipse(255, 313 - (stone.LowY - stone.Y) / (stone.LowY - stone.TopY) * (313 - 277), 20, 7, 0, 0, Math.PI * 2);
        ctx.fill()


    }



    //必要完成：各種量條(像是高度)、噴水(碰觸水面)、是否要做可以左右移動(optional)

    //非必要，但期許要做：各種顏色選色、逼真的問題(浪、空間軸的訂定)
    var sinkI = 1 / 24;
    // 石頭跳動的感覺
    function stoneJump() {

        if (endFlag) {

            //畫個石頭沉沒的動畫

            if (sinkI > 12 / 24) {
                document.getElementById("StoneSink").pause();
                document.getElementById("StoneSink").currentTime = 0;
                overFlag = true;
            }
            //石頭在水裡的部分
            document.getElementById("StoneSink").play();
            ctx.beginPath();
            ctx.globalAlpha = 1;
            ctx.fillStyle = "grey";
            ctx.ellipse(stone.X, stone.Y, stone.RX, stone.RY, 0, Math.PI * 2 * (1 / 4 - sinkI), Math.PI * 2 * (sinkI + 1 / 4), true);
            ctx.fill();

            //真石頭
            ctx.beginPath();
            ctx.globalAlpha = 0.6;
            ctx.fillStyle = "grey";
            ctx.ellipse(stone.X, stone.Y, stone.RX, stone.RY, 0, Math.PI * (1 / 4 - sinkI), Math.PI * 2 * (sinkI + 1 / 4), false);
            ctx.fill();
            sinkI += 1 / 24;


        }
        else {
            drawStone((stone.LowY - stone.Y) * 0.2 / 30);  //依照石頭達到的高度去做比例放大

            //石頭到最高點
            if (stone.Y < stone.TopY) {
                stone.VY = Math.abs(stone.VY);
                if (stone.TopY < 300 && moveSpeed > 1.5)
                    stone.ClickFlag = true;

                //不管有沒有按先暫定
                stone.TemperY = stone.LowY - (stone.LowY - stone.TopY) * 0.6;
                $("#clickMsg2").css("display", "none");


            }

            //石頭到最低點
            else if (stone.Y > stone.LowY) {
                stone.ClickFlag = false;
                stone.VY = -Math.abs(stone.VY * 1);

                waterModel.touchWater(144, 300, 1000, array2d);

                //讓聲音可以重複觸發
                document.getElementById("StoneSkip1").pause();
                document.getElementById("StoneSkip1").currentTime = 0;
                document.getElementById("StoneSkip2").pause();
                document.getElementById("StoneSkip2").currentTime = 0;
                document.getElementById("StoneSkip3").pause();
                document.getElementById("StoneSkip3").currentTime = 0;


                if ($("#clickMsg2").text() == "Bad~" && stone.TopY < 300) {
                    $("#clickMsg2").css("display", "block");
                }

                //不同時間點點擊的音效
                if ($("#clickMsg2").text() == "Great!!") {
                    document.getElementById("StoneSkip3").play();
                } else if ($("#clickMsg2").text() == "Good") {
                    document.getElementById("StoneSkip2").play();
                } else {
                    document.getElementById("StoneSkip1").play();
                }



                // 彈跳降速****
                moveSpeed = stone.Accelerate * moveSpeed;
                moveSpeed -= 0.2 * moveSpeed;
                stone.TopY = stone.TemperY;
                if (stone.TopY > 307 || moveSpeed < 1.2)
                    endFlag = true;
            }

            if (stone.Y <= 310) {


                document.getElementById("WindStrong").pause();
                document.getElementById("WindStrong").currentTime = 0;
                document.getElementById("LightWind").pause();
                document.getElementById("LightWind").currentTime = 0;
                stone.VZ = 0;
                $("#clickMsg").css("display", "none");
            }

            if (stone.VZ > 0) {


                stone.Y -= stone.VZ;
                stone.LowY = stone.Y;
                stone.TopY = stone.Y - 30;
            }
            else {
                stone.Y += stone.VY;
                stone.LowY = 310

                //石頭點擊彈跳，係數啥的真不容易****
                if (stone.ClickFlag) {

                    pressBar();
                    stone.Accelerate = 1;
                    $("#clickMsg2").css("color", "white")
                    $("#clickMsg2").text("Bad~");

                    $("canvas").one("click", function () {
                        document.getElementById("ClickSound").play();
                        if (stone.Y > stone.LowY - (stone.LowY - stone.TopY) * 0.3) {
                            //完美點擊:不減高度、減緩降速
                            stone.TemperY = stone.LowY - (stone.LowY - stone.TopY) * 0.9;
                            stone.Accelerate = 1.15;
                            $("#clickMsg2").css("color", "red")
                            $("#clickMsg2").text("Great!!");

                        } else if ((stone.Y > stone.LowY - (stone.LowY - stone.TopY) * 0.8) && (stone.Y < stone.LowY - (stone.LowY - stone.TopY) * 0.3)) {
                            //普通點擊
                            stone.TemperY = stone.LowY - (stone.LowY - stone.TopY) * 0.8;
                            $("#clickMsg2").css("color", "#00ff00")
                            $("#clickMsg2").text("Good");

                        } else {
                            //最差點擊
                            stone.TemperY = stone.LowY - (stone.LowY - stone.TopY) * 0.6;
                            $("#clickMsg2").css("color", "white")
                            $("#clickMsg2").text("Bad~");

                        }
                        stone.ClickFlag = false;


                        $("#clickMsg2").css("display", "block");
                    })

                }

            }
        }
    }


    // 海浪的物件
    function wave(x, y, shape, tier) {
        this.X = x;
        this.Y = y;
        this.tier = Math.ceil(Math.random() * 3)
        //海浪有兩種可以切換
        if (Math.random() < 0.5)
            this.shape = "﹌".repeat(Math.floor(Math.random() * 3 + 3))
        else
            this.shape = "﹋".repeat(Math.floor(Math.random() * 3 + 3))
    }

    // 用prototype共用畫WAVE
    wave.prototype.drawWave = function () {
        ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.font = "35px Arial"
        ctx.fillText(this.shape, this.X, this.Y);
        if (this.tier > 1)
            ctx.fillText(this.shape, this.X, this.Y + 10);
        if (this.tier > 2)
            ctx.fillText(this.shape, this.X, this.Y + 20);
    };

    // 浪的預備工作，需要先至少三道
    waveList = [];

    for (var i = 0; i < 3; i++) {
        //海浪的水平位移也是隨機
        waveList.push(new wave(Math.random() * 200, 100 * i));
        waveList[i].drawWave();
    }

    function testWave() {

        //讓畫面上保留隨機的波浪數(最低要為7個)
        if ((waveList.length < 7 || Math.random() < 0.005) && waveList[0].Y > 100)
            waveList.unshift(new wave(Math.random() * 200, -Math.random() * 100));

        waveList.forEach(function (item, index, array) {
            //這邊先暫定海浪移動速度是1****，將來要看石頭的移動速度!!
            item.Y += moveSpeed;
            item.drawWave();
        })

        if (waveList[waveList.length - 1].Y > 520) {
            waveList.pop();

        }
    }

    //分數顯示
    function scoreDisplay() {
        dist += Math.round(Math.abs(moveSpeed));

        if (stone.Y > stone.LowY)
            bounce += 1;
        //距離
        ctx.fillStyle = "white";
        ctx.textAlign = "left";
        ctx.textBaseline = "center";
        ctx.font = "15px Georgia"
        ctx.fillText("Distance :" + dist, 180, 30);

        //彈跳數
        ctx.fillText("Bounce   :" + bounce, 180, 50);

    }

    // 遊戲開始函數
    function proceedGame() {
        ctx.fillStyle = "aqua";

        ctx.clearRect(0, 0, 288, 512);
        if (dist < 1000) {
            ctx.globalAlpha = 0.6 - (0.6 - 0.3) * dist / 1000;
        }else {
            ctx.globalAlpha = 0.3;
        }
        ctx.fillRect(0, 0, 288, 512);

        testWave();
        stoneJump();
        scoreDisplay();

        var start = setTimeout(proceedGame, 1000 / 24);

        // 沒速度或高度太低就結束了
        if (overFlag) {
            clearTimeout(start);
            //清空訊息
            $("#clickMsg2").text("");
            $("#clickMsg2").css("display", "none");

            //成績結算以及重新開始
            ctx.clearRect(0, 0, 288, 512);

            ctx.globalAlpha = 0.9;
            ctx.fillStyle = "#adad85";
            ctx.fillRect(0, 0, 288, 512);

            ctx.fillStyle = "white";
            ctx.textAlign = "left";
            ctx.textBaseline = "center";

            //距離
            ctx.font = "30px Georgia"
            ctx.fillText("Distance          :" + dist, 20, 140);

            //彈跳數
            ctx.fillText("Bounce(×100):" + bounce * 100, 20, 200);
            //總和
            ctx.fillText("Total                 :" + eval(dist + bounce * 100), 20, 260);

            //分數標題
            ctx.textAlign = "center";
            ctx.font = "35px Georgia"
            ctx.fillText("Score", 144, 80);

            //根據分數顯示文字
            ctx.font = "45px Georgia"
            if (dist + bounce * 100 >= 2000) {
                ctx.fillStyle = "#ff471a";
                ctx.fillText("Well Done!", 144, 420);
            }
            else if (dist + bounce * 100 < 2000 && dist + bounce * 100 >= 1000) {
                ctx.fillStyle = "#00ff00";
                ctx.fillText("Nice", 144, 420);
            }
            else {
                ctx.fillStyle = "white";
                ctx.fillText("Almost there", 144, 420);
            }



            //重新開始條
            ctx.beginPath()
            ctx.fillStyle = "blue";
            ctx.moveTo(0, 300);
            ctx.lineTo(288, 300);
            ctx.moveTo(288, 350);
            ctx.lineTo(0, 350);
            ctx.stroke();

            ctx.font = "35px Comic Sans MS"
            ctx.fillText("Play again", 144, 335);

            $("canvas").one("click", function () {

                //重新開始回歸預設值
                dist = 0;
                bounce = 0;
                stone.X = 144;
                stone.Y = 400;
                stone.LowY = 400;
                stone.TopY = 380;
                stone.TemperY = 280;
                waveList = [];
                endFlag = false;
                overFlag = false;
                sinkI = 1 / 24;

                for (var i = 0; i < 3; i++) {
                    //海浪的水平位移也是隨機
                    waveList.push(new wave(Math.random() * 200, 100 * i));
                    waveList[i].drawWave();
                }
                startBar();
            })

        }
    }


    //開頭丟出石頭量條
    function startBar() {

        //這行非常詭異，不加就會顯示訊息QQ
        $("#clickMsg2").css("display", "none");

        //讓箭頭飛
        function arrow1() {
            ctx.clearRect(0, 0, 288, 512);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = "aqua";
            ctx.fillRect(0, 0, 288, 512);
            moveSpeed = 0;
            drawStone(0);

            // 漸層量條
            ctx.globalAlpha = 1.0;
            var lineargradient = ctx.createLinearGradient(24, 450, 264, 450);
            lineargradient.addColorStop(0, 'white');
            lineargradient.addColorStop(0.4, 'green');
            lineargradient.addColorStop(0.7, 'yellow');
            lineargradient.addColorStop(1, 'red');
            ctx.fillStyle = lineargradient;
            ctx.fillRect(24, 450, 240, 10);

            //邊框
            ctx.strokeRect(24, 450, 240, 10)

            //指標
            ctx.beginPath();
            ctx.moveTo(arrow1x, arrow1y);
            ctx.lineTo(arrow1x + 20, arrow1y);
            ctx.lineTo(arrow1x + 10, arrow1y + 15);
            ctx.lineTo(arrow1x, arrow1y);
            ctx.stroke();

            if (arrow1x > 244 || arrow1x < 24)
                arrow1Direction = 1 - arrow1Direction;

            //不同區間不同速度
            // if (arrow1x < 119.2)
            //     arrow1Vx = arrow1StandardVx;
            // else if (arrow1x > 119.2 && arrow1x < 193.6)
            //     arrow1Vx = 1.5 * arrow1StandardVx;
            // else if (arrow1x > 193.6)
            //     arrow1Vx = 2 * arrow1StandardVx;

            if (arrow1Direction)
                arrow1x += arrow1Vx;
            else
                arrow1x -= arrow1Vx;

        }

        var startArrow = setInterval(arrow1, 1000 / 24);

        $("canvas").one("click", function () {
            document.getElementById("ClickSound").play();

            clearInterval(startArrow);
            //不同時間點點擊有不同的速度
            if (arrow1x <= 24 + (264 - 24) * 0.2) {
                moveSpeed = 2;
                stone.VZ = 3;
                $('#clickMsg').css("color", "white");
                $('#clickMsg').text("Bad");
                $("#clickMsg").css("display", "block");
                document.getElementById("LightWind").play();
            }
            else if (arrow1x > 24 + (264 - 24) * 0.2 && arrow1x <= 24 + (264 - 24) * 0.55) {
                moveSpeed = 3;
                stone.VZ = 3.5;
                $('#clickMsg').css("color", "green");
                $('#clickMsg').text("Not Bad~");
                $("#clickMsg").css("display", "block");
                document.getElementById("LightWind").play();
            }
            else if (arrow1x > 24 + (264 - 24) * 0.55 && arrow1x <= 24 + (264 - 24) * 0.85) {
                moveSpeed = 5;
                stone.VZ = 4;
                $('#clickMsg').css("color", "yellow");
                $('#clickMsg').text("Good!");
                $("#clickMsg").css("display", "block");
                document.getElementById("LightWind").play();
            }
            else {
                moveSpeed = 8;
                stone.VZ = 6;
                $('#clickMsg').css("color", "red");
                $('#clickMsg').text("Extraordinary!!");
                $("#clickMsg").css("display", "block");
                document.getElementById("WindStrong").play();
            }
            stone.VY = -2;


            //點一下轉去後續進行
            proceedGame();
        })
    }

    function startGame() {
        //開始遊戲的畫面
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#adad85";
        ctx.fillRect(0, 0, 288, 512);
        ctx.beginPath();

        //開始遊戲上下兩條
        ctx.fillStyle = "blue";
        ctx.moveTo(0, 230);
        ctx.lineTo(288, 230);
        ctx.moveTo(288, 280);
        ctx.lineTo(0, 280);
        ctx.stroke();

        //開始遊戲條
        ctx.fillStyle = "black";
        ctx.textAlign = "center";
        ctx.textBaseline = "center";
        ctx.font = "35px Comic Sans MS"
        ctx.fillText("Start Game", 144, 265);

        //跳轉去遊戲開始量條
        $("canvas").one("click", function () {
            document.getElementById("BGM").loop = true;
            document.getElementById("BGM").volume = 0.2;
            document.getElementById("BGM").play();

            startBar();
        })
    }
    startGame()

}
