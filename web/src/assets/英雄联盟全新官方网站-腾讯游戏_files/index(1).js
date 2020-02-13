"use strict";
(function () {
    /** ͼƬ�ֲ����λjs  **/
    window.Promo = {
        containerWidth: 820,
        autoPlayDelay: 3000,
        promoImgList: null,
        promoTitleSpan: null,
        nowIndex: null,
        amount: 5,
        timeOut: null,
        init: function () {
            var templist = $('#promoTitleList').append($('#promoImgList .title'));
            this.promoImgList = $('#promoImgList');
            this.promoTitleSpan = templist.children('span');
            this.initControl();
            this.promoImgList.find('.loading-tip').remove();
        },
        /**�����߼�*/
        initControl: function () {
            //Ӧ�ÿ��
            this.promoImgList.css('width', this.containerWidth * this.amount + 'px');
            this.promoTitleSpan.css('width', this.containerWidth / this.amount + 'px');
            //����hover�¼�
            this.promoTitleSpan.unbind().on('mouseover', function (e) {
                var $this = $(this);
                var index = +$this.index();
                Promo.moveNext(index);
                window['PTTSendClick'] && PTTSendClick('indexScrollHover', 'scroll-' + $this.attr('data-bannerid'), $this.text());
            });
            //��ʼ
            this.moveNext(0);
        },
        /**�ƶ�����,�������±�,��ת���±��Ӧͼ;û�д���,��ת����һ��*/
        moveNext: function (index) {
            var nextIndex;
            if (typeof (index) !== 'undefined') {
                nextIndex = index;
            } else {
                nextIndex = ++this.nowIndex;
                nextIndex >= this.amount && (nextIndex = 0);
            }

            //�����Զ������¼�׼����һ���Զ�����
            clearTimeout(this.timeOut);
            this.timeOut = setTimeout(this.moveNext.bind(this), this.autoPlayDelay);

            //ͼƬ�ƶ�
            this.promoImgList.animate({
                'marginLeft': -nextIndex * 820 + 'px'
            }, {
                queue: false,
                duration: 200
            });
            this.promoTitleSpan.removeClass('selected').eq(nextIndex).addClass('selected');

            //��¼��ǰͼƬ�±�
            this.nowIndex = nextIndex;
        }
    };
    /** �����б�,newslist.js�ľ����
     * ע��:
     * ������һ�ֽӿ�,���������ӿڶ���ͬ,��������һ����ģ����������������͹���,��Ⱦ��*/
    var NewsJs = {
        pageMaxNews: 7,
        /*���Զ���첽����ͬʱ������ŵ��µĴ���,����������ҳʹ�÷�ҳ���������������ʶ������*/
        nowShowId: null,
        /*���ݻ���,���ع������ݾͲ��ټ���,ֱ����sendOneRequest����*/
        dataCache: {},
        newsListContainer: null,
        init: function () {
            this.newsListContainer = $('#J_newsListContainer');
            this.delayRunFunc();
            //�����ؼ���,����
            // DelayExpand.addDelay({
            //     $el: $('.m-news'),
            //     delayRunFunc: this.delayRunFunc.bind(this)
            // });
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            //����tab�л�,�Զ�ѡ���ʼ����һ����ǩ
            new L_CommTab({
                p_title: '.m-news [data-newsId]',
                //tab�л��ص��¼�
                changeStartBack: function ($title) {
                    var newsId = $title.attr('data-newsId');
                    var newsTit = $title.text();
                    var apiType = $title.attr('data-apitype');
                    this.changeNewsTab(newsId, apiType);
                    //�ϱ�����
                    window['PTTSendClick'] && PTTSendClick('Notice', 'Notice' + ($title.index() + 1), newsTit);
                }.bind(this)
            });
        },
        /**��ȡƴ�Ӻ��api*/
        getApi: function (newsId) {
            return '//apps.game.qq.com/cmc/zmMcnTargetContentList?r0=jsonp&page=1&num=' + this.pageMaxNews + '&target=' + newsId + '&source=web_pc';
        },
        changeNewsTab: function (newsId, apiType) {
            //����ǰNewsJs����Ϊ����������ʾ��id
            this.nowShowId = newsId;
            //�ж����ͽ��벻ͬ����������ʹ�������
            if (apiType === 'cross') {
                this.TypeCross.sendOneRequest(newsId);
            } else {
                this.sendOneRequest(newsId);
            }
        },
        /*����һ�������б�����*/
        sendOneRequest: function (newsId) {
            addLoadingTip('ing', '#J_newsListContainer', 'li');
            //�ж��Ƿ������ݻ���
            if (this.dataCache[newsId]) {
                this.getNewsSuccess(newsId, this.dataCache[newsId]);
            } else {
                var requestParam = {
                    apiUrl: this.getApi(newsId),
                    $requestType: 'ajax',
                    attach: this,
                    data: {
                        type: "get",
                        dataType: 'jsonp',
                        jsonp: 'r1',
                        xhrFields: {
                            withCredentials: true
                        }
                    },
                    successBack: function (e) {
                        if (+e.status === 1) {
                            //ִ�гɹ��ص�
                            this.attach.getNewsSuccess(newsId, e.data);
                        }
                    },
                    failBack: function () {
                        addLoadingTip('fail', '#J_newsListContainer', 'li', true);
                    }
                };
                RequestApi(requestParam);
            }
        },
        getNewsSuccess: function (newsId, newsData) {
            //�п�����ͨ�����������,����ͨ�������ж��Ƿ���Ҫ�ٴ���һ������
            if (!this.dataCache[newsId]) {
                this.handleData(newsData);
                //�滺��
                this.dataCache[newsId] = newsData;
                newsData.newsId = newsId;
            }
            this.fullNews(newsId, newsData.result);
        },
        /**��������*/
        handleData: function (newsData) {
            var result = newsData.result;
            var tempOne, sTagIdsArray, backKey, temp;
            //�ϱ��Ĳ������� deng
            var popiDocID = []; //����id
            var popsType = []; //��������
            var hrefArr = []; //�ϱ���url
            for (var i = 0, j = result.length; i < j; ++i) {
                tempOne = result[i];
                //��ȡʱ���ַ���
                tempOne.l_time = tempOne.sIdxTime.substr(5, 5);

                //����tag��ʽ,��������sTagIds�������id
                backKey = sTagIdsTagsKey.ndefault;
                if (tempOne.sVID) {
                    backKey = sTagIdsTagsKey.video;
                }
                else if (tempOne['sTagIds']) {
                    sTagIdsArray = tempOne.sTagIds.split(',');
                    for (var i2 = sTagIdsArray.length - 1; i2 >= 0; --i2) {
                        temp = sTagIdsTagsKey[sTagIdsArray[i2]];
                        if (temp) {
                            backKey = temp;
                            break;
                        }
                    }
                }
                tempOne.tagData = backKey;

                if (tempOne.sRedirectURL) {
                    var href = tempOne.sRedirectURL;
                    if (href.indexOf('docid') > 0) {
                        tempOne.sRedirectURL = href;
                    } else {
                        if (href.indexOf('?') > 0) {
                            tempOne.sRedirectURL = href + '&docid=' + tempOne.iDocID;
                        } else {
                            tempOne.sRedirectURL = href + '?docid=' + tempOne.iDocID;
                        }

                    }
                } else {
                    if (tempOne.sVID) {
                        tempOne.sRedirectURL = '//lol.qq.com/v/v2/detail.shtml?docid=' + tempOne.iDocID;
                    } else {
                        //ƴ��Ϊ������������ҳ
                        tempOne.sRedirectURL = '//lol.qq.com/news/detail.shtml?docid=' + tempOne.iDocID;
                    }
                }


                // �����ع����� deng
                popiDocID.push(tempOne.iDocID);
                popsType.push('news');
                hrefArr.push(tempOne.sRedirectURL);
            }
            // ���� �ع��ϱ�
            SendEAS.sendNewsPOP(popiDocID.join('|'), popsType.join('|'), hrefArr.join('|'))
        },
        /**����ɹ�֮��,�������,newsDataList:����*/
        fullNews: function (newsId, newsDataList) {
            //�Ա�newsId�Ƿ������ڱ�ѡ�е�idһ��
            if (this.nowShowId === newsId) {
                this.newsListContainer.html(template('J_newsItemTemplate', newsDataList));
            }
        },
        /**��������cross�ӿڵ���ģ�� */
        TypeCross: {
            /*���ݻ���,���ع������ݾͲ��ټ���,ֱ����sendOneRequest����*/
            dataCache: {},
            /**��ȡƴ�Ӻ��api*/
            getApi: function (newsId) {
                return '//apps.game.qq.com/cmc/cross?serviceId=3&source=zm&tagids=' + newsId + '&typeids=1,2&withtop=yes&limit=7';
            },
            /*����һ�������б�����*/
            sendOneRequest: function (newsId) {
                addLoadingTip('ing', '#J_newsListContainer', 'li');
                //�ж��Ƿ������ݻ���
                if (this.dataCache[newsId]) {
                    this.getNewsSuccess(newsId, this.dataCache[newsId]);
                } else {
                    var requestParam = {
                        apiUrl: this.getApi(newsId),
                        $requestType: 'ajax',
                        attach: this,
                        data: {
                            type: "get",
                            xhrFields: {
                                withCredentials: true
                            }
                        },
                        successBack: function (e) {
                            if (+e.status === 0) {
                                //ִ�гɹ��ص�
                                this.attach.getNewsSuccess(newsId, e.data);
                            }
                        },
                        failBack: function () {
                            addLoadingTip('fail', '#J_newsListContainer', 'li', true);
                        }
                    };
                    RequestApi(requestParam);
                }
            },
            getNewsSuccess: function (newsId, newsData) {
                //�п�����ͨ�����������,����ͨ�������ж��Ƿ���Ҫ�ٴ���һ������
                if (!this.dataCache[newsId]) {
                    this.handleData(newsData);
                    //�滺��
                    this.dataCache[newsId] = newsData;
                    newsData.newsId = newsId;
                }
                NewsJs.fullNews(newsId, newsData.items);
            },
            /**��������*/
            handleData: function (newsData) {
                var result = newsData.items;
                var tempOne, sTagIdsArray, backKey, temp;
                //�ϱ��Ĳ������� deng
                var popiDocID = []; //����id
                var popsType = []; //��������
                var hrefArr = []; //�ϱ���url
                for (var i = 0, j = result.length; i < j; ++i) {
                    tempOne = result[i];
                    //��ȡʱ���ַ���
                    tempOne.l_time = tempOne.sIdxTime.substr(5, 5);

                    //����tag��ʽ,��������sTagIds�������id
                    backKey = sTagIdsTagsKey.ndefault;
                    if (!tempOne.sRedirectURL && tempOne.sVID) {
                        backKey = sTagIdsTagsKey.video;
                    }
                    else if (tempOne['sTagIds']) {
                        sTagIdsArray = tempOne.sTagIds.split(',');
                        for (var i2 = 0, j2 = sTagIdsArray.length; i2 < j2; ++i2) {
                            temp = sTagIdsTagsKey[sTagIdsArray[i2]];
                            if (temp) {
                                backKey = temp;
                                break;
                            }
                        }
                    }
                    tempOne.tagData = backKey;

                    if (tempOne.sRedirectURL) {
                        var href = tempOne.sRedirectURL;
                        if (href.indexOf('docid') > 0) {
                            tempOne.sRedirectURL = href;
                        } else {
                            if (href.indexOf('?') > 0) {
                                tempOne.sRedirectURL = href + '&docid=' + tempOne.iDocID;
                            } else {
                                tempOne.sRedirectURL = href + '?docid=' + tempOne.iDocID;
                            }

                        }
                    } else {
                        if (tempOne.sVID) {
                            tempOne.sRedirectURL = '//lol.qq.com/v/v2/detail.shtml?docid=' + tempOne.iDocID;
                        } else {
                            //ƴ��Ϊ������������ҳ
                            tempOne.sRedirectURL = '//lol.qq.com/news/detail.shtml?docid=' + tempOne.iDocID;
                        }
                    }


                    // �����ع����� deng
                    popiDocID.push(tempOne.iDocID);
                    popsType.push('news');
                    hrefArr.push(tempOne.sRedirectURL);
                }
                // ���� �ع��ϱ�
                SendEAS.sendNewsPOP(popiDocID.join('|'), popsType.join('|'), hrefArr.join('|'))
            }
        }
    };
    /** �����,actcenter.js�ľ����*/
    var ActionJs = {
        /**������¼�����ȡ���ڽ��еĻ*/
        init: function () {
            addLoadingTip('ing', '#J_actListContainer', 'li');
            this.loadData();
            //�����ع�������,����
            // DelayExpand.addDelay({
            //     $el: $('.m-act'),
            //     delayRunFunc: this.delayRunFunc.bind(this)
            // });
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            //����Ҳ���Ϸ�������붯��
            $('.m-act,.m-gamefunc-nav').addClass('indexpart-show');
        },
        loadData: function () {
            //���س��̳��ػ���ȫ���
            var requestParam = {
                apiUrl: '//ossweb-img.qq.com/images/clientpop/act/lol/lol_act_1_index.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                successBack: function () {
                    try {
                        if (action) {
                            ActionJs.checkLoadOver();
                        } else {
                            //�ٴ�����
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                }
            };
            RequestApi(requestParam);
            //�����̳ǻ
            var requestTHParam = {
                apiUrl: '//ossweb-img.qq.com/images/clientpop/act/lol/lol_act_4_index.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                successBack: function () {
                    try {
                        if (match) {
                            ActionJs.checkLoadOver();
                        } else {
                            //�ٴ�����
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                }
            };
            RequestApi(requestTHParam);
        },
        /**�����ĸ�Ϊ���ݻ���*/
        All: null,
        ZZJX: null,
        SCTH: null,
        CQHD: null,
        /**��������Ƿ�������,������Ӧ����*/
        checkLoadOver: function () {
            if (window['action'] && window['match']) {
                //����������ԭʼ����
                this.All = action;
                this.SCTH = match;

                var temp;
                //����Ѱ��"���ڽ���",���"���ڻ"�����"�����ڻ",û�н����ķŵ�ȫ�������ǰ��
                var newAllZZJX = [];
                var newAllOhter = [];
                this.ZZJX = [];
                this.CQHD = [];
                for (var i = 0, j = this.All.length; i < j; ++i) {
                    temp = this.All[i];
                    if (+temp.iDate === -2 && +temp.iStatus === 998) {
                        //��ǲ����ڻ
                        temp.isUnknown = true;
                        this.ZZJX.push(temp);
                        newAllZZJX.push(temp);
                    } else if (+temp.iDate === 0 && +temp.iStatus === 999) {
                        //��ǳ��ڻ
                        temp.isLong = true;
                        this.CQHD.push(temp);
                        newAllZZJX.push(temp);
                    } else if (window.activityDataHandle.culRemainTime(temp) > 0) {
                        this.ZZJX.push(temp);
                        newAllZZJX.push(temp);
                    } else {
                        newAllOhter.push(temp);
                    }
                }
                this.All = newAllZZJX.concat(newAllOhter);
                for (var i = 0, j = this.SCTH.length; i < j; ++i) {
                    temp = this.SCTH[i];
                    if (+temp.iDate === -2 && +temp.iStatus === 998) {
                        //����̳ǲ����ڻ
                        temp.isUnknown = true;
                    } else if (+temp.iDate === 0 && +temp.iStatus === 999) {
                        //����̳ǳ��ڻ
                        temp.isLong = true;
                    } else if (window.activityDataHandle.culRemainTime(temp) > 0) {
                        this.ZZJX.push(temp);
                    }
                }
                //�󶨲����¼�,��ʼ��tab���
                new L_CommTab({
                    p_title: '.m-act [data-actname]',
                    changeStartBack: function ($title) {
                        //��ȡ�������tab������actname
                        var dataName = $title.attr('data-actname');
                        var dataTit = $title.text();
                        //��ȡǰ4��,�����
                        ActionJs.fullAction(ActionJs.getOnePageData(dataName, 0, 4));
                        window['PTTSendClick'] && PTTSendClick('act', 'act-' + dataName, dataTit);

                    }
                });
            }
        },
        /**��ȡһ����ҳ����,dataType��������;dataStartIndex,dataLength�������ݵ�λ��*/
        getOnePageData: function (dataType, dataStartIndex, dataLength) {
            //�ж�DataControl�Ƿ����������
            if (!this[dataType]) {
                console.log('û�������ҳ����������DataControl');
            }
            //��������ķ�ҳ����
            return this.searchData(dataType, dataStartIndex, dataLength);
        },
        /**�����������ƺ���������λ�ò��Ҳ���������*/
        searchData: function (dataType, dataStartIndex, dataLength) {
            var tempArray = this[dataType].slice(dataStartIndex, dataStartIndex + dataLength);
            //��������״̬
            this.handleData(tempArray);
            //���ػ�����б�͵�ǰ���ݳ����µ���ҳ��
            return tempArray;
        },
        /**��һ��ԭʼ��������Ƿ�"���ڻ","new"��"������ʾ"*/
        handleData: function (tempArray) {
            var tempOne;
            for (var i = 0, j = tempArray.length; i < j; ++i) {
                tempOne = tempArray[i];
                if (tempOne.isLong) {
                    //���ڻ����ʾ
                    tempOne.remainTip = "���ڻ";
                } else if (tempOne.isUnknown) {
                    //�����ڻ����ʾ
                    tempOne.remainTip = "��ʱ�";
                } else {
                    tempOne.remainTip = window.activityDataHandle.culOverTimeTip(tempOne);
                }
                //�����Ƿ���new
                tempOne.isNew = window.activityDataHandle.checkNewAct(tempOne);
            }
        },
        /**����б�*/
        fullAction: function (data) {
            $('#J_actListContainer').html(template('J_actItemTemplate', {
                list: data
            }));
        }
    };
    /**  �汾���²���  **/
    var NewVersion = {
        versionVideo: null,
        init: function () {
            addLoadingTip('ing', '#J_newChampionContainer');
            addLoadingTip('ing', '#J_newSkinContainer');
            addLoadingTip('ing', '#J_newVersionContainer');
            addLoadingTip('ing', '#J_clubDeveloperContainer');
            addLoadingTip('ing', '#J_newModelContainer');
            this.loadData();
            //�����ع�������
            DelayExpand.addDelay({
                $el: $('.m-version-nav'),
                delayRunFunc: this.delayRunFunc.bind(this)
            });
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            //����Ҳ���Ϸ�������붯��
            $('.m-new-championskin,.m-version-nav').addClass('indexpart-show');
        },
        loadData: function () {
            //�������������Ƥ��,��Ӣ��,�°汾,���ְ�,�����߽�������
            if (window['OfficialWebsiteCfg']) {
                //����ģ����ع����js����,ֱ�����
                //�������
                NewVersion.fullData();
                //�󶨽����¼�
                NewVersion.bindEvent();
            } else {
                var requestParam = {
                    apiUrl: '//lol.qq.com/act/AutoCMS/publish/LOLWeb/OfficialWebsite/website_cfg.js?v=' + L_CommFunc.ran,
                    $requestType: 'getScript',
                    successBack: function () {
                        try {
                            if (OfficialWebsiteCfg) {
                                //�������
                                NewVersion.fullData.bind(NewVersion)();
                                //�󶨽����¼�
                                NewVersion.bindEvent.bind(NewVersion)();
                            } else {
                                //�ٴ�����
                                this.requestOne();
                            }
                        } catch (e) {
                            console.log(e);
                            //�ٴ�����
                            this.requestOne();
                        }
                    }
                };
                RequestApi(requestParam);
            }
            //�������������������
            var requestFreeParam = {
                apiUrl: '//lol.qq.com/biz/hero/free.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                successBack: function () {
                    try {
                        if (LOLherojs && LOLherojs.free) {
                            //�����������
                            NewVersion.fullFreeChampion();
                        } else {
                            //�ٴ�����
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                }
            };
            RequestApi(requestFreeParam);
        },
        /**�������*/
        fullData: function () {
            //��Ӣ��
            if (OfficialWebsiteCfg['champion']) {

                var champion = OfficialWebsiteCfg.champion;
                $('#J_newChampionContainer').html(template('J_newChampionTemplate', champion)).on("mouseenter", function (e) {

                    window['PTTSendClick'] && PTTSendClick('newchampionskin', 'newchampionskin-newchampion', '��Ӣ��');

                });
                this.getNewChampionAbility();
            }
            //��Ƥ��
            if (OfficialWebsiteCfg['skin']) {
                var mainSkin = OfficialWebsiteCfg.skin[0];
                mainSkin.vid = this.cutVid(mainSkin.hover);
                //��ȡ����Ƥ��������,�������������̫�����ݹ���
                var moreskin = OfficialWebsiteCfg.skin.slice(1, 8);
                $('#J_newSkinContainer').html(template('J_newSkinTemplate', mainSkin)).on("mouseenter", function (e) {
                    window['PTTSendClick'] && PTTSendClick('newchampionskin', 'newchampionskin-newSkin', '��Ƥ��');
                });
                $('#J_moreNewSkinContainer').html(template('J_moreNewSkinTemplate', moreskin));
                hoverPlayInnerVideo('#J_newSkinContainer,.m-more-skin');
            }
            //��Ϸ�°汾
            if (OfficialWebsiteCfg['version']) {
                var version = OfficialWebsiteCfg.version;
                version.vid = this.cutVid(version.hover);
                $('#J_newVersionContainer').html(template('J_newVersionTemplate', version)).on("mouseenter", function (e) {
                    window['PTTSendClick'] && PTTSendClick('version', 'version-versionupdate', '�°汾');
                });
                hoverPlayInnerVideo('#J_newVersionContainer');
            }
            //���ְ�
            if (OfficialWebsiteCfg['peripheral']) {
                var peripheral = OfficialWebsiteCfg.peripheral;
                $('#J_newModelContainer').html(template('J_newModelTemplate', peripheral)).on("mouseenter", function (e) {
                    window['PTTSendClick'] && PTTSendClick('version', 'version-newModel', '���ְ�');
                });
            }
            //������
            if (OfficialWebsiteCfg['developer']) {
                var developer = OfficialWebsiteCfg.developer;
                $('#J_clubDeveloperContainer').html(template('J_clubDeveloperTemplate', developer)).on("mouseenter", function (e) {
                    window['PTTSendClick'] && PTTSendClick('version', 'version-developerdetail', '������');
                });
            }
        },
        /**�����������*/
        fullFreeChampion: function () {
            //���ģ��
            $('#J_freeChampionContainer').html(template('J_freeChampionTemplate', LOLherojs.free));
            $('.week-free-champion>.week-free-a').on("mouseover", function () {
                window['PTTSendClick'] && PTTSendClick('version', 'version-free', '����');
            });
        },
        /**��ȡ��Ӣ��������������**/
        getNewChampionAbility: function () {
            //��ȡ��Ӣ��id
            var championId = +$('#J_championAbility').attr('data-championId');
            //û������Ӣ��id,����ʾ����
            if (!championId) {
                $('#J_championAbility .champion-ability').hide();
                return;
            }
            //������������
            var requestParam = {
                apiUrl: '//game.gtimg.cn/images/lol/act/img/js/hero/' + championId + '.js?v=' + L_CommFunc.ran,
                $requestType: 'ajax',
                data: {
                    dataType: "json"
                },
                successBack: function (data) {
                    try {
                        if (data && data.hero) {
                            NewVersion.handleChampionInfo(data.hero);
                        } else {
                            //�ٴ�����
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                }
            };
            RequestApi(requestParam);
        },
        /**������Ӣ����������*/
        handleChampionInfo: function (data) {
            var championAbility = $('#J_championAbility');
            championAbility.find('#J_attackBar').css('width', data.attack * 10 + '%');
            championAbility.find('#J_magicBar').css('width', data.magic * 10 + '%');
            championAbility.find('#J_defenseBar').css('width', data.defense * 10 + '%');
            championAbility.find('#J_hardBar').addClass('h' + Math.round(data.difficulty * 3 / 10));
        },
        /**�󶨽����¼�*/
        bindEvent: function () {
            //��ʾ������Ƥ��
            $('.m-new-skin-one .herf-more').on('click', function () {
                $('.m-new-skin-one .inner-hover').addClass('show');
            });
            //�رո�����Ƥ��
            $('.m-new-skin-one .hover-back').on('click', function () {
                $('.m-new-skin-one .inner-hover').removeClass('show');
            });

            //��ʼ������hover
            hoverShowInit('.week-free-a', '.week-free-hover');
            //��Ƥ��hover��ʾ����
            hoverShowInit('.m-new-skin-one', '.m-more-skin', true);
        },
        /**��Ѷ��Ƶ������س���Ƶid*/
        cutVid: function (txvideourl) {
            txvideourl = txvideourl.replace(/\//g, ' ');
            var result = txvideourl.match('\ {1}(\\S*).htm');
            if (result) {
                return result[1];
            } else {
                return false;
            }
        }
    };
    /** ��Ƶ��ר��,�����ݻ���
     * ר����������:1������Ƶ������������,2����Ƶ����ȡ��ĳһ���ר��idȥ����ר���б�����,3��ר��������ȡ������id,������������,4��ȡ����ͷ������,5���ר��
     * ��Ƶ��������:1������Ƶ�����������ݻ�ȡ��ǩ,2����ĳ�б�����,3���
     * **/
    window.VideoProgram = {
        init: function () {
            this.loadData();
            //�����ع�������
            DelayExpand.addDelay({
                $el: $('.g-wrap-vp'),
                delayRunFunc: this.delayRunFunc.bind(this)
            });
            //����hoverԤ��
            this.hoverImg.init();
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            $('.m-fresh-video,.m-hotprogram').addClass('indexpart-show');
        },
        loadData: function () {
            //������Ƶ������������,������ɺ����ר������Ƶ�ĳ�ʼ��
            var requestParam = {
                apiUrl: '//lol.qq.com/act/AutoCMS/publish/LOLWeb/VideoCenterCfg/video_cfg.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                successBack: function () {
                    try {
                        if (VideoCenterCfg) {
                            //����ɹ�,ִ�ж�Ӧ����
                            VideoProgram.getVideoCenterCfgSuccess();
                        } else {
                            //�ٴ�����
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                }
            };
            RequestApi(requestParam);
        },
        /**��Ƶ���������ļ����سɹ�,������Ƶ��ר������*/
        getVideoCenterCfgSuccess: function () {
            this.programProcess.init();
            this.videoProcess.init();
        },
        /*ר��ִ������*/
        programProcess: {
            /*ר�����ݻ���,�����ظ�����*/
            programDataCache: {},
            /*���һ���л�������Ҫ�������ݱ�ʶ,���ʱ�ж�,�������첽�������ʱ��ɴ���*/
            lastFullprogram: null,
            /*ר��swiper*/
            programSwiper: null,
            /*��ʼ��*/
            init: function () {
                //ר��tab�л�
                var programTab = new L_CommTab({
                    p_title: '.m-hotprogram .part-tab-title>li',
                    firstShow: false,
                    //tab�л��ص��¼�
                    changeStartBack: function ($title) {
                        var day = $title.attr('data-programDay');
                        var tabTit = $title.text();
                        this.changeProgramDay(day);
                        window['PTTSendClick'] && PTTSendClick('hotprogram', 'hotprogram-' + day, tabTit);
                    }.bind(this)
                });
                //�жϵ�ǰ�����ڼ�,��������ר��
                programTab.v_title.eq(new Date().getDay() - 1).trigger('mouseover');

                //������벻����,��ȥ������
                $('#J_HotprogramList').on('mouseover', function () {
                    this.programSwiper && this.programSwiper.stopAutoplay();
                }.bind(this)).on('mouseout', function () {
                    this.programSwiper && this.programSwiper.startAutoplay();
                }.bind(this));
            },
            /*�л�ר��tab*/
            changeProgramDay: function (programDay) {
                //��¼һ���л�������Ҫ�������ݱ�ʶ
                this.lastFullprogram = programDay;
                //�����������ݺ������������
                this.getProgramData(programDay);
            },
            /*����ĳ���ר����Ϣ,VideoCenterCfg���ݱ����Ѿ���ɼ���*/
            getProgramData: function (programDay) {
                addLoadingTip('ing', '#J_programContainer', 'li');
                //�ж��Ƿ��л���
                if (this.programDataCache[programDay]) {
                    this.fullProgram(programDay, this.programDataCache[programDay]);
                } else {
                    //����ר��id
                    var programDayId = VideoCenterCfg.album_rec[programDay].toString();
                    var requestParam = {
                        apiUrl: '//apps.game.qq.com/cmc/zmMcnCollectionList?r0=jsonp&collectionid=' + programDayId + '&source=web_pc',
                        $requestType: 'ajax',
                        attach: this,
                        data: {
                            type: "get",
                            dataType: 'jsonp',
                            jsonp: 'r1'
                        },
                        successBack: function (e) {
                            try {
                                if (e.msg === 'OK') {
                                    //����ɹ�,����attach����programProcess�ĳɹ���������
                                    this.attach.getProgramDataSuccess(programDay, e);
                                } else {
                                    //�ٴ�����
                                    this.requestOne();
                                }
                            } catch (e) {
                                console.log(e);
                                //�ٴ�����
                                this.requestOne();
                            }
                        },
                        failBack: function () {
                            addLoadingTip('fail', '#J_programContainer', 'li', true);
                        }
                    };
                    RequestApi(requestParam);
                }
            },
            /*����ĳ���ר����Ϣ�������,����������Ϣ,�Ա��ȡͷ��*/
            getProgramDataSuccess: function (programDay, programData) {
                //��ȡ����id
                var authorId = [];
                for (var i = 0, j = programData.data.result.length; i < j; ++i) {
                    authorId.push(programData.data.result[i].authorID);
                }
                authorId = authorId.toString();
                var requestParam = {
                    apiUrl: '//apps.game.qq.com/cmc/zmMcnAuthorList?r0=jsonp&authorid=' + authorId,
                    $requestType: 'ajax',
                    attach: this,
                    data: {
                        type: "get",
                        dataType: 'jsonp',
                        jsonp: 'r1'
                    },
                    successBack: function (e) {
                        try {
                            if (e.msg === 'OK') {
                                //����ɹ�,����attach����programProcess�ĳɹ���������
                                this.attach.getAuthorSuccess(programDay, programData, e);
                            } else {
                                //�ٴ�����
                                this.requestOne();
                            }
                        } catch (e) {
                            console.log(e);
                            //�ٴ�����
                            this.requestOne();
                        }
                    }
                };
                RequestApi(requestParam);
            },
            /*��ȡ������Ϣ�ɹ�,���մ���ר�����������ݵ�ģ����Ҫ�Ľṹ,�����뻺��*/
            getAuthorSuccess: function (programDay, programData, authorData) {
                var programResult = programData.data.result;
                var authorResuld = authorData.data.result;
                var authorID, oneProgram, skva;
                for (var pi = 0, pj = programResult.length; pi < pj; ++pi) {
                    //�����Ա���������,������ͷ���uuid���ӽ�ר������
                    oneProgram = programResult[pi];
                    authorID = oneProgram.authorID;
                    skva = window.searchKeyValueEqualArray(authorResuld, 'authorID', authorID);
                    oneProgram.avatar = skva.avatar;
                    oneProgram.uuid = skva.uuid;
                    //����sLatestItem�ַ���Ϊjson
                    oneProgram.sLatestItem && (oneProgram.sLatestItem = $.parseJSON(oneProgram.sLatestItem));
                }
                //���뻺��
                this.programDataCache[programDay] = programData;

                //���
                this.fullProgram(programDay, programData);
            },
            /*���ר��*/
            fullProgram: function (programDay, programData) {
                //�ж��Ƿ������һ����������
                if (this.lastFullprogram !== programDay) return;
                //���
                $('#J_programContainer').html(template(
                    'J_programTemplate',
                    programData.data
                ));
                //���³�ʼ��swiper
                var ifLoop = (programData.data.result.length < 4) ? (false) : (true);
                this.programSwiper && this.programSwiper.destroy();
                this.programSwiper = new Swiper('#J_HotprogramList', {
                    slidesPerView: 3,
                    slidesPerGroup: 3,
                    autoplay: 3000,
                    autoplayDisableOnInteraction: false,
                    loop: ifLoop,
                    simulateTouch: false,
                    onFirstInit: function (swiper) {
                        swiper.setWrapperTranslate(0, 0, 0);
                    }
                });
                if (ifLoop) {
                    $('.hotprogram-list-left,.hotprogram-list-right').css('display', 'block');
                } else {
                    $('.hotprogram-list-left,.hotprogram-list-right').css('display', 'none');
                }
                //���Ұ�ť
                $('.hotprogram-list-left').unbind().on('click', function () {
                    this.programSwiper && this.programSwiper.swipePrev();
                }.bind(this));
                $('.hotprogram-list-right').unbind().on('click', function () {
                    this.programSwiper && this.programSwiper.swipeNext();
                }.bind(this));
            }
        },
        /*��Ƶִ������*/
        videoProcess: {
            /*������Ƶ���ݻ���,�����ظ�����*/
            flashVideoDataCache: {},
            //��Ƶtab title��������tag��id
            newTags: ['1933'],
            /*��ʼ����������*/
            init: function () {
                //����������Ϣ������,"�Ƽ�"�ӿڲ�һ����Ҫע��,�����Ķ��÷����"����"id
                var titleLi = '<li data-tabvalue="recommend" data-page="1">�Ƽ�</li>';
                var temptags;
                for (var i = 0, j = VideoCenterCfg.tags.length; i < j; ++i) {
                    temptags = VideoCenterCfg.tags[i];
                    if (this.newTags.indexOf('' + temptags.cates[0].value) !== -1) {
                        titleLi += "<li data-tabvalue='" + temptags.cates[0].value + "' data-page='1'>" + temptags.name + "<i class='icon-new-1'></i></li>";
                    } else {
                        titleLi += "<li data-tabvalue='" + temptags.cates[0].value + "' data-page='1'>" + temptags.name + "</li>";
                    }
                }
                $('.m-fresh-video .part-tab-title').html(titleLi);
                //ר��tab�л�,�Զ�ѡ��һ����ǩ��ʼ��
                new L_CommTab({
                    p_title: '.m-fresh-video .part-tab-title>li',
                    //tab�л��ص��¼�
                    changeStartBack: function ($title) {
                        setTimeout(function () {
                            this.responseVedioTabChange($title);
                        }.bind(this), 0);
                    }.bind(this)
                });
                //��һ��/��һҳ��ť�������
                $('#change-batche').bind('click', function () {
                    var nowSelectedTitle = $(".m-fresh-video .part-tab-title .selected");
                    var pageNumber = nowSelectedTitle.attr('data-page');
                    nowSelectedTitle.attr('data-page', +pageNumber + 1);
                    //�������ݷ���
                    VideoProgram.videoProcess.responseVedioTabChange(nowSelectedTitle);
                });
            },
            /*�л���Ƶtab��Ӧ����*/
            responseVedioTabChange: function ($title) {
                var tabvalue = $title.attr('data-tabvalue');
                //��ȡ��ǰ�����pageҳ��
                var pagenumber = $title.attr('data-page');
                //������������
                this.requestVedioList(tabvalue, pagenumber);
                //����tab�����л��ұ�"��һҳ"/"��һ��"
                if (tabvalue === 'recommend') {
                    $('#change-batche').html('<span class="change-batche">' + '��һ��' + '<i class="icon-hyp"></i>' + '</span>');
                }
                //��ͨ����
                else {
                    $('#change-batche').html('<span class="change-page">' + '��һҳ' + '<i class="icon-page"></i>' + '</span>');
                }
                //�ϱ��л�����
                window['PTTSendClick'] && PTTSendClick('newVideo', 'newVideo-' + tabvalue, "�л�����������Ƶ����");
            },
            /*�����б�����*/
            requestVedioList: function (tabvalue, pagenumber) {
                addLoadingTip('ing', '#J_flashVideoContainer', 'li', true);
                //�ж��Ƿ��л���
                if (this.flashVideoDataCache['' + tabvalue + pagenumber]) {
                    //���ڻ���,ֱ�����
                    this.fullVideo(this.flashVideoDataCache['' + tabvalue + pagenumber]);
                } else {
                    var apiUrl;
                    if (tabvalue === 'recommend') {
                        apiUrl = '//apps.game.qq.com/cmc/zmMcnRecommendedVideoCenterVideoList?r0=jsonp&reset=0&num=8&source=web_pc';
                    } else {
                        apiUrl = '//apps.game.qq.com/wmp/v3.1/?p0=3&p1=searchKeywordsList&page=' + pagenumber + '&pagesize=8&order=sIdxTime&type=iTag&id=' + tabvalue + '&r0=jsonp&source=web_pc';
                    }
                    var requestParam = {
                        apiUrl: apiUrl,
                        $requestType: 'ajax',
                        attach: this,
                        data: {
                            type: "get",
                            dataType: 'jsonp',
                            jsonp: 'r1'
                        },
                        successBack: function (e) {
                            try {
                                if (e.msg === 'OK') {
                                    //�Ƽ�����ɹ�,����attach����programProcess�ĳɹ���������
                                    e.data.pagenumber = pagenumber;
                                    e.data.tabvalue = tabvalue;
                                    this.attach.requestVedioListSuccess(e.data);
                                } else if (+e.status === 0) {
                                    //����������ҳ����ɹ�,����attach����programProcess�ĳɹ���������
                                    e.msg.pagenumber = pagenumber;
                                    e.msg.tabvalue = tabvalue;
                                    this.attach.requestVedioListSuccess(e.msg);
                                } else {
                                    //�ٴ�����
                                    this.requestOne();
                                }
                            } catch (e) {
                                console.log(e);
                                //�ٴ�����
                                this.requestOne();
                            }
                        },
                        failBack: function () {
                            if (this.attach.lastFullFlashVideo !== tabvalue) return;
                            addLoadingTip('fail', '#J_flashVideoContainer', 'li', true);
                        }
                    };
                    RequestApi(requestParam);
                }
            },
            /*�б���������ɹ�,�������ݲ�����Ԥ��ͼ����*/
            requestVedioListSuccess: function (listData) {
                //�ض�Ϊ8��
                listData.result = listData.result.slice(0, 8);
                var tempResult = listData.result;
                //�ϱ��Ĳ������� deng
                var popiDocID = []; //����id
                var popsType = []; //��������
                var hrefArr = [];
                for (var i = 0, j = tempResult.length; i < j; ++i) {
                    //�Ƽ�������ȫ��ûת����,�����ĸ���ҳ����ת��
                    if (listData.tabvalue === 'recommend') {
                        //ת����Ƶʱ�䳤��
                        tempResult[i].iTime = window.L_timeToDate(tempResult[i].iTime, 'second', 'minute');
                        //ת�����Ŵ���
                        tempResult[i].iTotalPlay = window.L_converUnit(tempResult[i].iTotalPlay, 'ones', 1);
                    }
                    //ת������ʱ��
                    tempResult[i].sIdxTime = window.convertUpdate(tempResult[i].sIdxTime);

                    // �����ع����� deng
                    popiDocID.push(tempResult[i].iDocID);
                    popsType.push('video');
                    hrefArr.push(tempResult[i].sUrl);
                }
                //���뻺��
                this.flashVideoDataCache['' + listData.tabvalue + listData.pagenumber] = listData;
                //���
                this.fullVideo(listData);
                // ��Ƶ �ع��ϱ�
                SendEAS.sendVideoPOP(popiDocID.join('|'), popsType.join('|'), hrefArr.join('|'))

                //�������ͼ����
                var vidArray = [];
                for (var i = 0, j = listData.result.length; i < j; ++i) {
                    vidArray.push(listData.result[i].sVID);
                }
                VideoProgram.hoverImg.getHoverImg(vidArray);
            },
            /*���*/
            fullVideo: function (listData) {
                //��ȡ��ǰtab ��������,�����ݲ�����,��������
                var nowSelectedTitle = $(".m-fresh-video .part-tab-title .selected");
                var tabvalue = nowSelectedTitle.attr('data-tabvalue');
                var pagenumber = nowSelectedTitle.attr('data-page');
                if (listData.tabvalue == tabvalue && listData.pagenumber == pagenumber) {
                    $('#J_flashVideoContainer').html(template('J_flashVideoTemplate', listData));
                }
            }
        },
        /*hoverԤ��ͼ��������*/
        hoverImg: {
            /*���ݻ���,��vidΪkey*/
            dataCache: {},
            /*size key*/
            sizeKey: '640_360',
            init: function () {
                //����������Ҫhover��ȡԤ��ͼ����Ƶ
                var _self = this;
                $('body').on('mousemove', '.video-item', function (e) {
                    _self.handleMousemove(e, this);
                }).on('mouseout', '.video-item', function () {
                    $(this).find('.video-pre-wrap').hide();
                });
            },
            /*��������ƶ��¼�*/
            handleMousemove: function (event, dom) {
                var offsetX = event.offsetX;
                //��֧��offsetX ����;
                if (!offsetX) return;

                var $dom = $(dom),
                    vid = $dom.data('vid'),
                    data = this.dataCache[vid];
                //�ж��Ƿ��������
                if (typeof data === 'undefined' || +data.retcode !== 0) return;
                data = data.fields.smart_pic_infos[this.sizeKey];
                var domWidth = $dom.width(),
                    imgLength = data.length;

                //ÿ��ͼ���ƶ����
                var moveStep = domWidth / imgLength;
                //������Ӧ��ͼƬ˳��
                var posIndex = Math.ceil(offsetX / moveStep);
                //Ѱ�����˳���Ӧ��ͼƬ
                var showData = window.searchKeyValueEqualArray(data, 'pos', posIndex);

                $dom.find('.video-pre-img').attr('src', showData.url);
                $dom.find('.video-pre-wrap').show();

                $dom.find('.video-pre-bar>i').css('width', 100 / imgLength * posIndex + '%');
            },
            /*��ȡԤ��ͼ����*/
            getHoverImg: function (vidArray) {
                var vidStringList = vidArray.join(',');
                var requestParam = {
                    apiUrl: '//union.video.qq.com/fcgi-bin/data?otype=json&union_jsonp=1&tid=1269&appid=20001800&appkey=3e303d6412e2d71d&idlist=' + vidStringList,
                    $requestType: 'ajax',
                    attach: this,
                    data: {
                        type: "get",
                        dataType: 'jsonp'
                    },
                    successBack: function (e) {
                        try {
                            if (e.results && e.results.length) {
                                //��������
                                this.attach.handleData(e.results);
                            } else {
                                //�ٴ�����
                                this.requestOne();
                            }
                        } catch (e) {
                            console.log(e);
                            //�ٴ�����
                            this.requestOne();
                        }
                    },
                };
                RequestApi(requestParam);
            },
            /*�����ȡ��������,������*/
            handleData: function (result) {
                var resultOne, fields, data;
                for (var i = 0, j = result.length; i < j; ++i) {
                    resultOne = result[i];

                    if (+resultOne.retcode !== 0) continue;

                    fields = resultOne.fields;
                    this.dataCache[resultOne.id] = resultOne;
                    if (fields.smart_pic_infos) {
                        fields.smart_pic_infos = JSON.parse(fields.smart_pic_infos);
                        //�ų�pos=0��ͼƬ
                        data = fields.smart_pic_infos[this.sizeKey];
                        for (var i2 = 0, j2 = data.length; i2 < j2; ++i2) {
                            if (+data[i2].pos === 0) {
                                data.splice(i2, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }
    };
    /**  ��Ϸ���ܵ�������  **/
    var SlideNav = {
        init: function () {
            this.bssHover();
        },
        /*�������hoverЧ��*/
        bssHover: function () {
            var hover$ = $('#slideNavHover');
            //�ӳٹر�,����Ƶ�������رպ�hover
            var timeout;
            $('#J_gamebss,#slideNavHover').on('mouseover', function (e) {
                e.preventDefault();
                e.stopPropagation();
                clearTimeout(timeout);
                if (!hover$.hasClass('show')) {
                    hover$.addClass('show');
                }
            }).on('mouseout', function (e) {
                e.preventDefault();
                e.stopPropagation();
                clearTimeout(timeout);
                timeout = setTimeout(function () {
                    hover$.removeClass('show');
                }, 100);
            })
        }
    };
    /**  �����,���� **/
    var RightNavBar = {
        navBar: null,
        navtitle: null,
        window$: null,
        windowDocument: null,
        init: function () {
            this.windowDocument = $(window.document);
            this.window$ = $(window);
            this.navtitle = $('.rightnav-bar [data-scrollto]');
            this.navBar = $('.rightnav-bar');
            //������Ļ����
            this.window$.on('resize', this.checkShow.bind(this));
            this.checkShow();
            //�������
            this.windowDocument.on('scroll', this.handleScroll.bind(this));
            this.handleScroll();
            //�󶨵��������ת
            var scrollEl = $('[data-scrollto]');
            scrollEl.on('click', function () {
                var tempThis = $(this);
                var aimEl = $(tempThis.attr('data-scrollto'));
                $('html,body').animate({
                    scrollTop: aimEl.offset().top
                }, 200);
                RightNavBar.changeTitleClass(tempThis);
            });
            $('.rn-polo').on('click', function () {
                $('html,body').animate({
                    scrollTop: 0
                });
            });
        },
        handleScroll: function () {
            var scrollTop = this.windowDocument.scrollTop();
            //�ж��Ƿ������ʾ�ص�����
            if (scrollTop > 250) {
                this.navBar.addClass('showTop');
            } else {
                this.navBar.removeClass('showTop');
            }
            //�жϱ��⼤��
            var needChangeEl;
            var tempTop;
            for (var i = 0, j = this.navtitle.length; i < j; ++i) {
                tempTop = $(this.navtitle.eq(i).attr('data-scrollto')).offset().top;
                if (scrollTop + this.window$.height() / 2 > tempTop) {
                    needChangeEl = this.navtitle.eq(i);
                }
            }
            if (needChangeEl) {
                this.changeTitleClass(needChangeEl);
            } else {
                this.changeTitleClass(null);
            }
        },
        changeTitleClass: function ($el) {
            this.navtitle.removeClass('selected');
            $el && $el.addClass('selected');
        },
        checkShow: function () {
            if (this.windowDocument.width() < 1428) {
                this.navBar.removeClass('show');
            } else {
                this.navBar.addClass('show');
            }
        }
    };
    /**
     * ���²���js ��������ͷ���������Լ���������ģ��
     * ���̣�
     * 1��дmatchId��
     * 2����lpl��̨��Ӧ��Ҫ��ʾ���������ýӿڣ�
     * 3��ѯģ�������ļ�indexMatchConfig.js���Ƿ��ж�Ӧ��ģ��
     * 4��ȡ��д������ģ�壬��ģ�帺�������������Ⱦ
     * ע��:Ϊ�˱����ڴ�й©,�л�����ʱ,��Ⱦ����ģ��dom����none����ʽ������ҳ����.����,ģ���dom֮�䲻������ͬ��id
     * **/
    var EventJs = {
        matchId: 134, //����ÿ��ֻ��ʾһ�����£�������¿��ܷ�Ϊ�ܶ������£��糣�������������ȵȣ���gameType������
        configData: null, //�������¶�Ӧ����ʾ�����ļ�
        nowMatch: null,
        gameModeList: window.gameModeList,
        init: function () {
            //��ȡcss�ļ�
            $('head').append('<link rel="stylesheet" href="/v3/css/index-match.css">');

            //�����ؼ���,��������
            DelayExpand.addDelay({
                $el: $('.g-wrap-match'),
                delayRunFunc: this.delayRunFunc.bind(this)
            });
            //����ԤԼ��ť
            $('.m-events-container').on('click', '[data-dinyue]', function (e) {
                var tempTarget = $(e.target);
                if (+tempTarget.data('ordered') === 1) {
                    this.canceldinyue(tempTarget);
                } else {
                    this.dinyue(tempTarget);
                }
            }.bind(this));
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            $('.g-wrap-match').addClass('indexpart-show');
            this.loadMatchConfig();
        },
        loadMatchConfig: function () {
            addLoadingTip('ing', '.m-events-container', 'span', true);
            //��ȡģ�������ļ�
            var requestMatchConfigParam = {
                apiUrl: '//lol.qq.com/v3/index-match-module/indexMatchConfig.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                attach: this,
                successBack: function () {
                    try {
                        if (window['indexMatchConfig']) {
                            this.attach.getDataSuccess();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                },
                failBack: function () {
                    addLoadingTip('fail', '.m-events-container', 'li', true);
                }
            };
            RequestApi(requestMatchConfigParam);
            //��ȡҪ��ʾ�����������ļ�
            var requestConfigParam = {
                apiUrl: '//lpl.qq.com/web201612/data/LOL_MATCH2_GAME_' + this.matchId + '_GAMETYPE_INFO.js?v=' + L_CommFunc.ran,
                $requestType: 'getScript',
                attach: this,
                successBack: function () {
                    try {
                        if (+GameTypeList.status === 0) {
                            this.attach.configData = GameTypeList.msg;
                            this.attach.getDataSuccess();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                },
                failBack: function () {
                    addLoadingTip('fail', '.m-events-container', 'li', true);
                }
            };
            RequestApi(requestConfigParam);
            //��ȡ��������ͷ��
            var requestEventNewsParam = {
                apiUrl: '//lol.qq.com/cms/match2/data/LOL_MATCH2_NEWS_RECOMMEND_126_INFO.js?v=' + L_CommFunc.ran,
                $requestType: 'ajax',
                attach: this,
                data: {
                    dataType: 'json'
                },
                successBack: function (e) {
                    try {
                        if (+e.status === 0) {
                            this.attach.getEventNewsSuccess(e.msg);
                        } else {
                            //�ٴ�����
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                }
            };
            RequestApi(requestEventNewsParam);
            //��ȡս������
            var requestTeamParam = {
                apiUrl: '//lpl.qq.com/web201612/data/LOL_MATCH2_TEAM_LIST.js',
                $requestType: 'getScript',
                attach: this,
                successBack: function () {
                    try {
                        if (+TeamList.status === 0) {
                            window.TeamList = TeamList.msg;
                            this.attach.getDataSuccess();
                        } else {
                            //�ٴ�����
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                },
                failBack: function () {
                    addLoadingTip('fail', '#m-events-container', 'span', true);
                }
            };
            RequestApi(requestTeamParam);
        },
        getDataSuccess: function () {
            //�������ݺ�ս�����ݶ��Ѿ�׼����
            if (this.configData && window['TeamList'] && window['indexMatchConfig']) {
                this.loadConfigSuccess();
                //�����������ʾ
                $('.m-events-container').html('');
            }
        },
        loadConfigSuccess: function () {
            //���ͷ������,������ҪĬ����ʾ�ı�����selected��
            var matchTabLi = '';
            var tempKeyData;
            for (var i = 0, j = this.configData.length; i < j; ++i) {
                tempKeyData = this.configData[i];
                //��Ҫ��matchid��gametype���������±����ϣ��Ա�����ģ��ӱ����ϻ�ȡ����
                matchTabLi += '<li data-default="' + tempKeyData.iDefault + '" data-open="' + tempKeyData.iOpen + '" data-matchid="' + this.matchId + '" data-gametype="' + tempKeyData.GameTypeId + '" data-configid="' + this.matchId + '_' + tempKeyData.GameTypeId + '">' + tempKeyData.GameTypeName + '</li>';
                //matchTabLi += '<li data-default="' + tempKeyData.iDefault + '" data-open="1" data-matchid="' + this.matchId + '" data-gametype="' + tempKeyData.GameTypeId + '" data-configid="' + this.matchId + '_' + tempKeyData.GameTypeId + '">' + tempKeyData.GameTypeName + '</li>';
            }
            $('.g-wrap-match .part-tab-title').html(matchTabLi).children('[ data-default=1]').addClass('selected');
            //��ʼ��һ������,����ҪĬ����ʾ�ı�����select
            new L_CommTab({
                p_title: '.g-wrap-match .part-tab-title>li',
                //tab�л��ص��¼�
                changeStartBack: function ($title) {
                    this.changeMatchTab($title.data('matchid'), $title.data('gametype'), $title.data('open'));
                    window['PTTSendClick'] && PTTSendClick('match', 'match-tab' + ($title.index() + 1), $title.text())
                }.bind(this)
            });
        },
        /*�����������ųɹ�*/
        getEventNewsSuccess: function (data) {
            if (!data[127].length > 0) return;
            var innerData = data[127][0];
            var news = $('#J_eventTopNews').html('<img src="' + innerData.sIMG + '" width="25" height="25" alt="' + innerData.sTitle + '">' + innerData.sTitle);
            news.attr('href', innerData.sUrl).attr('onclick', "PTTSendClick('match','match-sj','" + innerData.sTitle + "')").css('display', 'block');
        },
        /*�л�����tab*/
        changeMatchTab: function (matchKey, gameType, open) {
            //������һ������key,�����첽����������
            this.nowMatch = matchKey + '_' + gameType;
            //�ж��Ƿ��Ѿ������������
            var nowMatch = $('.m-events-container>#' + matchKey + '_' + gameType);
            if (nowMatch.length) {
                //�л���������
                this.changeContent();
            } else {
                //�ж��Ƿ��Ǿ����ڴ�
                if (+open === 1) {
                    this.getMatchHtm(indexMatchConfig[matchKey][gameType], matchKey, gameType);
                } else {
                    var tempString = this.produceWait();
                    this.putInPage(tempString, matchKey, gameType);
                }
            }
        },
        /*����һ������ģ��*/
        getMatchHtm: function (url, matchKey, gameType) {
            //û�������ַ��Ĭ��Ϊ������ҳ�ĵ�ַ���³���,�����ж�ȥ�������ڴ�.
            if (!url) {
                var tempString = this.produceWait();
                this.putInPage(tempString, matchKey, gameType);
                return;
            };
            //��ȡ�����ļ�
            var getMatchHtm = {
                apiUrl: url,
                $requestType: 'ajax',
                data: {
                    dataType: 'html'
                },
                attach: this,
                successBack: function (e) {
                    this.attach.putInPage(e, matchKey, gameType);
                },
                failBack: function () {
                    this.attach.putInPage("<div class='wait-tip'><img src='//ossweb-img.qq.com/images/lol/v3/polo-sleep.gif'><a>��������С���ˣ����Ժ�����</a></div>", matchKey, gameType);
                }
            };
            RequestApi(getMatchHtm);
        },
        /*������ģ���ļ����뵽ҳ��*/
        putInPage: function (htmString, matchKey, gameType) {
            var htmdiv = $(document.createElement('div')).attr('id', matchKey + '_' + gameType).append(htmString);
            htmdiv.css('display', 'none').addClass('match-show');
            $('.m-events-container').append(htmdiv);
            //�л���������
            this.changeContent();
        },
        /*�л���������*/
        changeContent: function () {
            $('.m-events-container>div').css('display', 'none');
            $('#' + this.nowMatch).css('display', 'block');
        },
        /*���ɾ���ȴ�*/
        produceWait: function () {
            return "<div class='wait-tip'><img src='//ossweb-img.qq.com/images/lol/v3/polo.gif'><a>�����ڴ�</a></div>";
        },
        /*ԤԼ*/
        dDinYueUrl: "//apps.game.qq.com/lol/match/apis/searchVideoSubscibe.php",
        dinyue: function ($btn) {
            var qtMatchId = $btn.attr('data-dinyue');
            var self = this;
            /*����¼״̬*/
            var loginS = function (tLogin) {
                //�Ѿ���¼,����ԤԼ����
                var goUrl = self.dDinYueUrl + "?type=1&r1=retObj&elements_id=" + qtMatchId;
                $.getScript(goUrl, function () {
                    if (+retObj.status === 0) {
                        alert("ԤԼ�ɹ�");
                        $btn.html('ȡ��ԤԼ').attr('data-ordered', '1');
                    } else {
                        if (retObj.msg === "Already Subscribed") {
                            alert("���Ѿ�ԤԼ���ⳡ����");
                            $btn.html('ȡ��ԤԼ').attr('data-ordered', '1');
                        } else {
                            alert(retObj.msg);
                        }
                    }
                });
            };
            var loginF = function (tLogin) {
                //��δ��¼,������¼�ɹ��¼�
                tLogin.on(tLogin.eventType.login, loginS, self);
                //�����¼
                tLogin.login();
            };

            /*��������ʼ��״̬*/
            var readyS = function (tLogin) {
                //��¼����ɹ���ʼ��,�жϵ�¼״̬
                tLogin.checkLogined(loginS, loginF);
            };
            var readyF = function (tLogin) {
                //��¼������ڳ�ʼ��,������ʼ���ɹ��¼�
                tLogin.on(tLogin.eventType.ready, readyS, self);
            };
            T_Login.checkReady(readyS, readyF);
        },
        canceldinyue: function ($btn) {
            var qtMatchId = $btn.attr('data-dinyue');
            var self = this;
            var goUrl = self.dDinYueUrl + "?type=2&r1=retObj&elements_id=" + qtMatchId;
            $.getScript(goUrl, function () {
                if (+retObj.status === 0) {
                    alert("ȡ��ԤԼ�ɹ�");
                    $btn.html('ԤԼ').attr('data-ordered', '0');
                } else {
                    alert(retObj.msg);
                }
            });
        }
    };
    /**  Ӣ������  **/
    var ChampionData = {
        championList: null,
        listScroll: null,
        init: function () {
            addLoadingTip('ing', '#J_championItemContainer', 'li', true);
            //�����ؼ���
            DelayExpand.addDelay({
                $el: $('.g-wrap-championlist'),
                delayRunFunc: this.delayRunFunc.bind(this)
            });
        },
        /**����������жϹ�����������λ��ʱ,ִ���л�ͼƬ�ĵ�ַ.��������������img,����Ϊ��Ļ���Ԫ�ع���������Ļ��,����������޷���ȷ�ж�λ��*/
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            //�Ѿ�������Ӣ������
            this.delayLoaded = true;
            $('.g-wrap-championlist>.g-wrap').addClass('indexpart-show');
            //���ж��Ƿ���Ӣ���б�����,��newLOLherojsȫ�ֱ������
            if (window.newLOLherojs) {
                //�������
                ChampionData.fullChampionData();
                //��ʼ������
                ChampionData.initScroll();
            } else {
                var requestParam = {
                    apiUrl: '//game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js?v=' + L_CommFunc.ran,
                    $requestType: 'ajax',
                    data: {
                        dataType: 'json'
                    },
                    successBack: function (data) {
                        try {
                            if (data && data.hero) {
                                window.newLOLherojs = data;
                                //�������
                                ChampionData.fullChampionData();
                                //��ʼ������
                                ChampionData.initScroll();
                            } else {
                                //�ٴ�����
                                this.requestOne();
                            }
                        } catch (e) {
                            console.log(e);
                            //�ٴ�����
                            this.requestOne();
                        }
                    },
                    failBack: function () {
                        addLoadingTip('fail', '#J_championItemContainer', 'li', true);
                    }
                };
                RequestApi(requestParam);
            }
        },
        fullChampionData: function () {
            //��Ϊ��champion.js�л�����hero_list.js,Ϊ�˲��޸�shtml�����Ⱦģ��,�����ر�ʹ��js�滻��ģ������
            var championItem = document.getElementById("championItem");
            var tempInnerHTML = championItem.innerHTML;
            tempInnerHTML = tempInnerHTML.replace("{{each data}}", "{{each}}");
            tempInnerHTML = tempInnerHTML.replace("{{$value.id}}.png", "{{$value.alias}}.png");
            tempInnerHTML = tempInnerHTML.replace("id={{$value.id}}", "id={{$value.heroId}}");
            tempInnerHTML = tempInnerHTML.replace("champion.{{$value.id}}", "champion.{{$value.alias}}");
            tempInnerHTML = tempInnerHTML.replace("$value.tags", "$value.roles");
            championItem.innerHTML = tempInnerHTML;
            //���ȫ��Ӣ������
            var container = $('#J_championItemContainer');
            container.html(template('championItem', window.newLOLherojs.hero));

            //��������ɸѡ
            this.monitorSort();
        },
        /*��ʼ��������*/
        initScroll: function () {
            this.listScroll = new Swiper('#J_ChampionListContainer', {
                scrollContainer: true,
                mode: 'vertical',
                preventLinks: true,
                grabCursor: true,
                cssWidthAndHeight: true,
                mousewheelControl : true,
                scrollbar: {
                    container: '#J_ChampionListContainer>.scrollbar',
                    hide: false,
                    draggable: true
                }
            });
        },
        /**��������ɸѡ*/
        monitorSort: function () {
            var tempLi = $('#J_championSortType>li');
            tempLi.on('click', function () {
                tempLi.removeClass('selected');
                var sort = $(this).addClass('selected').attr('data-sort');
                //ͳһת��Сд
                sort = sort.toLowerCase();
                var tabTxt = $(this).text()
                ChampionData.showTagChampion(sort);
                window['PTTSendClick'] && PTTSendClick('championlist', 'championlist-' + ($(this).index() + 1), tabTxt);
            });
        },
        /**��ʾĳ����ǩ��Ӣ��,��������Ӣ��*/
        showTagChampion: function (tag) {
            this.championList || (this.championList = $('#J_championItemContainer>li'));
            if (tag === 'all') {
                this.championList.css('display', 'block');
            } else {
                this.championList.each(function () {
                    var tempThis = $(this);
                    if (tempThis.attr('data-tags').indexOf(tag) === -1) {
                        tempThis.css('display', 'none');
                    } else {
                        tempThis.css('display', 'block');
                    }
                })
            }
            //���³�ʼ��������
            this.listScroll.reInit();
            this.listScroll.resizeFix();
            this.listScroll.setWrapperTranslate(0, 0, 0);
        }
    };
    /**  fanart����  **/
    var FanartJs = {
        init: function () {
            addLoadingTip('ing', '#J_fanartContainer', 'li', true);
            //�����ؼ���
            DelayExpand.addDelay({
                $el: $('.g-wrap-fanart'),
                delayRunFunc: this.delayRunFunc.bind(this)
            });
            //��ʼ������ý�尴ťhover,ͬʱ�ڻص����ʼ��swiper
            hoverShowInit('.href-partner', '.partner-list-container', false, this.hoverbackInitSwiper.bind(this));
            //��������
            $('#J_fanart').on('click', '[data-zan]', this.requestZan);
        },
        delayLoaded: false,
        delayRunFunc: function () {
            if (this.delayLoaded) return;
            this.delayLoaded = true;
            $('.fanart-left,.fanart-right').addClass('indexpart-show');
            //����������ؾ�Ʒר��
            if (window['OfficialWebsiteCfg']) {
                //����ģ����ع����js����,ֱ�����
                FanartJs.fullCorneradv();
            } else {
                var requestParam = {
                    apiUrl: '//lol.qq.com/act/AutoCMS/publish/LOLWeb/OfficialWebsite/website_cfg.js?v=' + L_CommFunc.ran,
                    $requestType: 'getScript',
                    successBack: function () {
                        try {
                            if (OfficialWebsiteCfg) {
                                FanartJs.fullCorneradv();
                            } else {
                                //�ٴ�����
                                this.requestOne();
                            }
                        } catch (e) {
                            console.log(e);
                            //�ٴ�����
                            this.requestOne();
                        }
                    }
                };
                RequestApi(requestParam);
            }
            //����fanart����
            var requestFanartParam = {
                apiUrl: '//apps.game.qq.com/lol/lolapi/recommendContentList.php?r1=fanartdata&a0=recommendList&page=1&pagesize=20&source=web_pc',
                $requestType: 'ajax',
                data: {
                    dataType: 'script'
                },
                successBack: function () {
                    try {
                        if (+fanartdata.status === 0) {
                            //���
                            FanartJs.fullFanart(fanartdata);
                        } else {
                            //�ٴ�����
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                },
                failBack: function () {
                    addLoadingTip('fail', '#J_fanartContainer', 'li', true);
                }
            };
            RequestApi(requestFanartParam);
            //����ý����������
            var requestMediaParam = {
                apiUrl: '/v3/js/mediaData.js',
                $requestType: 'getScript',
                successBack: function (e) {
                    try {
                        if (L_mediaData) {
                            //���
                            FanartJs.fullMediaData(L_mediaData);
                        } else {
                            //�ٴ�����
                            this.requestOne();
                        }
                    } catch (e) {
                        console.log(e);
                        //�ٴ�����
                        this.requestOne();
                    }
                }
            };
            RequestApi(requestMediaParam);

            //�����ұ�����ͼƬ�ļ���
            $('#J_fanart').find("[data-imgsrc]").each(function () {
                var tempThis = $(this);
                tempThis.attr('src', tempThis.attr('data-imgsrc'));
            });
        },
        /**���fanart*/
        fullFanart: function (data) {
            //��ȡǰ8��
            data.msg.data = data.msg.data.slice(0, 8);
            $('#J_fanartContainer').html(template('J_fanartTemplate', {
                list: data.msg.data,
                fanartClassData: this.fanartClassData
            }));
            //����ͼƬ�ߴ�
            //this.monitorImgLoad(data.msg.data);
        },
        /**����ͼƬ���ز�����ͼƬ�ߴ�,����*/
        monitorImgLoad: function (list) {
            var fanartImg;
            //��������ͬʱ����һ��,��ü�������load���
            for (var i = 0, j = list.length; i < j; ++i) {
                fanartImg = $('#fanart' + i);
                fanartImg.on('load', function () {
                    FanartJs.adaptFanartImg(this);
                });
                this.adaptFanartImg(fanartImg[0]);
            }
        },
        adaptFanartImg: function (img) {
            var fanartImg = $(img);
            if (!img['naturalWidth']) return;

            var n_imgWidth = img.naturalWidth;
            var n_imgHeight = img.naturalHeight;

            var r_imgWidth, r_imgHeight;
            if (n_imgWidth > n_imgHeight) {
                fanartImg.css({
                    height: '176px',
                    width: 'auto'
                });
                r_imgHeight = 176;
                r_imgWidth = Math.ceil(176 / n_imgHeight * n_imgWidth);
            } else {
                fanartImg.css({
                    width: '192px',
                    height: 'auto'
                });
                r_imgWidth = 192;
                r_imgHeight = Math.ceil(192 / n_imgWidth * n_imgHeight);
            }
            fanartImg.css({
                left: '50%',
                top: '50%',
                marginTop: -r_imgHeight / 2 + 'px',
                marginLeft: -r_imgWidth / 2 + 'px'
            })
        },
        /**��侫Ʒר��*/
        fullCorneradv: function () {
            if (OfficialWebsiteCfg['corneradv']) {
                var corneradv = OfficialWebsiteCfg.corneradv;
                //���ģ��
                $('#J_mainColumn').html(template('J_mainColumnTemplate', corneradv));
            }
        },
        /**���ý������*/
        fullMediaData: function (mediaData) {
            $('#J_partnerContainer').html(template('J_partnerTemplate', mediaData));
        },
        scrollSwiper: null,
        /*��ʼ������ý�������,��Ҫ��display:block֮���ʼ��*/
        hoverbackInitSwiper: function () {
            window['PTTSendClick'] && PTTSendClick('fanart', 'fanart-other4', '����ý��');
            if (this.scrollSwiper) return;
            this.scrollSwiper = new Swiper('#J_partnerList', {
                scrollContainer: true,
                mode: 'vertical',
                preventLinks: true,
                mousewheelControl: true,
                grabCursor: true,
                scrollbar: {
                    container: '#J_partnerList>.scrollbar',
                    hide: false,
                    draggable: true
                }
            });
        },
        /*����*/
        requestZan: function (e) {
            var self = FanartJs;
            var tempTarget = $(e.target),
                iContentId, zanBtn;
            if (tempTarget.attr('data-zan')) {
                zanBtn = tempTarget;
            } else {
                zanBtn = tempTarget.parent();
            }
            iContentId = zanBtn.attr('data-zan');
            var params = {
                'iContentId': iContentId,
                'serviceType': 'lol',
                'sAction': 'zanContent',
                'sModel': 'zan',
                'actId': 16
            };
            var dataCallback = function (ret) {
                if (ret.iRet == '0') {
                    self.zanSuccess(zanBtn, ret.jData.iZanCount);
                } else if (ret.iRet == '-9999') {
                    alert(ret.sMsg);
                } else if (ret.iRet == '-1') {
                    T_Login.login();
                }
            };
            var requestData = {
                apiUrl: '//apps.game.qq.com/cms/index.php' + '?r0=jsonp&v=' + Math.random(),
                $requestType: 'ajax',
                timeout: 5000,
                tryTimes: 1,
                data: {
                    data: params,
                    dataType: 'jsonp',
                    xhrFields: {
                        withCredentials: true
                    }
                },
                successBack: dataCallback,
                failBack: function () {
                    alert("�ܱ�Ǹ����������ʱ��æ�������Ժ����ԣ�");
                }
            };
            new RequestApi(requestData);
        },
        /*���޳ɹ�*/
        zanSuccess: function ($btn, number) {
            $btn.addClass('on');
            $btn.children('.number').text(number);
        }
    };
    /**
     * ��ҳJs���
     * */
    var LolIndex = {
        /**��ҳjs��ʼ��*/
        init: function () {
            //������
            DelayExpand.init();
            //����
            NewsJs.init();
            //�
            ActionJs.init();
            //����
            EventJs.init();
            //��Ƶ
            VideoProgram.init();
            //�����
            RightNavBar.init();
            //�°汾����
            NewVersion.init();
            //��Ϸ���ܵ���
            SlideNav.init();
            //fanart
            FanartJs.init();
            //Ӣ������
            ChampionData.init();
        }
    };
    LolIndex.init();
})(window);
