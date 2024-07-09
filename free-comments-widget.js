console.log('free-comments-widget.js running on', window.location.href);

let FreeCommentsWidget = {}
FreeCommentsWidget.posts = new Map();
FreeCommentsWidget.postComments = new WeakMap();
FreeCommentsWidget.fcAccounts = new Map();
FreeCommentsWidget.afterRemoveListener = null;

FreeCommentsWidget.defaultSourceStyle = JSON.parse('{"0":"accent-color","1":"align-content","2":"align-items","3":"align-self","4":"alignment-baseline","5":"animation-composition","6":"animation-delay","7":"animation-direction","8":"animation-duration","9":"animation-fill-mode","10":"animation-iteration-count","11":"animation-name","12":"animation-play-state","13":"animation-range-end","14":"animation-range-start","15":"animation-timeline","16":"animation-timing-function","17":"app-region","18":"appearance","19":"backdrop-filter","20":"backface-visibility","21":"background-attachment","22":"background-blend-mode","23":"background-clip","24":"background-color","25":"background-image","26":"background-origin","27":"background-position","28":"background-repeat","29":"background-size","30":"baseline-shift","31":"baseline-source","32":"block-size","33":"border-block-end-color","34":"border-block-end-style","35":"border-block-end-width","36":"border-block-start-color","37":"border-block-start-style","38":"border-block-start-width","39":"border-bottom-color","40":"border-bottom-left-radius","41":"border-bottom-right-radius","42":"border-bottom-style","43":"border-bottom-width","44":"border-collapse","45":"border-end-end-radius","46":"border-end-start-radius","47":"border-image-outset","48":"border-image-repeat","49":"border-image-slice","50":"border-image-source","51":"border-image-width","52":"border-inline-end-color","53":"border-inline-end-style","54":"border-inline-end-width","55":"border-inline-start-color","56":"border-inline-start-style","57":"border-inline-start-width","58":"border-left-color","59":"border-left-style","60":"border-left-width","61":"border-right-color","62":"border-right-style","63":"border-right-width","64":"border-start-end-radius","65":"border-start-start-radius","66":"border-top-color","67":"border-top-left-radius","68":"border-top-right-radius","69":"border-top-style","70":"border-top-width","71":"bottom","72":"box-shadow","73":"box-sizing","74":"break-after","75":"break-before","76":"break-inside","77":"buffered-rendering","78":"caption-side","79":"caret-color","80":"clear","81":"clip","82":"clip-path","83":"clip-rule","84":"color","85":"color-interpolation","86":"color-interpolation-filters","87":"color-rendering","88":"column-count","89":"column-gap","90":"column-rule-color","91":"column-rule-style","92":"column-rule-width","93":"column-span","94":"column-width","95":"contain-intrinsic-block-size","96":"contain-intrinsic-height","97":"contain-intrinsic-inline-size","98":"contain-intrinsic-size","99":"contain-intrinsic-width","100":"container-name","101":"container-type","102":"content","103":"cursor","104":"cx","105":"cy","106":"d","107":"direction","108":"display","109":"dominant-baseline","110":"empty-cells","111":"field-sizing","112":"fill","113":"fill-opacity","114":"fill-rule","115":"filter","116":"flex-basis","117":"flex-direction","118":"flex-grow","119":"flex-shrink","120":"flex-wrap","121":"float","122":"flood-color","123":"flood-opacity","124":"font-family","125":"font-kerning","126":"font-optical-sizing","127":"font-palette","128":"font-size","129":"font-stretch","130":"font-style","131":"font-synthesis-small-caps","132":"font-synthesis-style","133":"font-synthesis-weight","134":"font-variant","135":"font-variant-alternates","136":"font-variant-caps","137":"font-variant-east-asian","138":"font-variant-ligatures","139":"font-variant-numeric","140":"font-variant-position","141":"font-weight","142":"grid-auto-columns","143":"grid-auto-flow","144":"grid-auto-rows","145":"grid-column-end","146":"grid-column-start","147":"grid-row-end","148":"grid-row-start","149":"grid-template-areas","150":"grid-template-columns","151":"grid-template-rows","152":"height","153":"hyphenate-character","154":"hyphenate-limit-chars","155":"hyphens","156":"image-orientation","157":"image-rendering","158":"initial-letter","159":"inline-size","160":"inset-block-end","161":"inset-block-start","162":"inset-inline-end","163":"inset-inline-start","164":"isolation","165":"justify-content","166":"justify-items","167":"justify-self","168":"left","169":"letter-spacing","170":"lighting-color","171":"line-break","172":"line-height","173":"list-style-image","174":"list-style-position","175":"list-style-type","176":"margin-block-end","177":"margin-block-start","178":"margin-bottom","179":"margin-inline-end","180":"margin-inline-start","181":"margin-left","182":"margin-right","183":"margin-top","184":"marker-end","185":"marker-mid","186":"marker-start","187":"mask-clip","188":"mask-composite","189":"mask-image","190":"mask-mode","191":"mask-origin","192":"mask-position","193":"mask-repeat","194":"mask-size","195":"mask-type","196":"math-depth","197":"math-shift","198":"math-style","199":"max-block-size","200":"max-height","201":"max-inline-size","202":"max-width","203":"min-block-size","204":"min-height","205":"min-inline-size","206":"min-width","207":"mix-blend-mode","208":"object-fit","209":"object-position","210":"object-view-box","211":"offset-anchor","212":"offset-distance","213":"offset-path","214":"offset-position","215":"offset-rotate","216":"opacity","217":"order","218":"orphans","219":"outline-color","220":"outline-offset","221":"outline-style","222":"outline-width","223":"overflow-anchor","224":"overflow-clip-margin","225":"overflow-wrap","226":"overflow-x","227":"overflow-y","228":"overlay","229":"overscroll-behavior-block","230":"overscroll-behavior-inline","231":"padding-block-end","232":"padding-block-start","233":"padding-bottom","234":"padding-inline-end","235":"padding-inline-start","236":"padding-left","237":"padding-right","238":"padding-top","239":"paint-order","240":"perspective","241":"perspective-origin","242":"pointer-events","243":"position","244":"r","245":"resize","246":"right","247":"rotate","248":"row-gap","249":"ruby-position","250":"rx","251":"ry","252":"scale","253":"scroll-behavior","254":"scroll-margin-block-end","255":"scroll-margin-block-start","256":"scroll-margin-inline-end","257":"scroll-margin-inline-start","258":"scroll-padding-block-end","259":"scroll-padding-block-start","260":"scroll-padding-inline-end","261":"scroll-padding-inline-start","262":"scroll-timeline-axis","263":"scroll-timeline-name","264":"scrollbar-color","265":"scrollbar-gutter","266":"scrollbar-width","267":"shape-image-threshold","268":"shape-margin","269":"shape-outside","270":"shape-rendering","271":"speak","272":"stop-color","273":"stop-opacity","274":"stroke","275":"stroke-dasharray","276":"stroke-dashoffset","277":"stroke-linecap","278":"stroke-linejoin","279":"stroke-miterlimit","280":"stroke-opacity","281":"stroke-width","282":"tab-size","283":"table-layout","284":"text-align","285":"text-align-last","286":"text-anchor","287":"text-decoration","288":"text-decoration-color","289":"text-decoration-line","290":"text-decoration-skip-ink","291":"text-decoration-style","292":"text-emphasis-color","293":"text-emphasis-position","294":"text-emphasis-style","295":"text-indent","296":"text-overflow","297":"text-rendering","298":"text-shadow","299":"text-size-adjust","300":"text-spacing-trim","301":"text-transform","302":"text-underline-position","303":"text-wrap","304":"timeline-scope","305":"top","306":"touch-action","307":"transform","308":"transform-origin","309":"transform-style","310":"transition-behavior","311":"transition-delay","312":"transition-duration","313":"transition-property","314":"transition-timing-function","315":"translate","316":"unicode-bidi","317":"user-select","318":"vector-effect","319":"vertical-align","320":"view-timeline-axis","321":"view-timeline-inset","322":"view-timeline-name","323":"view-transition-name","324":"visibility","325":"white-space-collapse","326":"widows","327":"width","328":"will-change","329":"word-break","330":"word-spacing","331":"writing-mode","332":"x","333":"y","334":"z-index","335":"zoom","336":"-webkit-border-horizontal-spacing","337":"-webkit-border-image","338":"-webkit-border-vertical-spacing","339":"-webkit-box-align","340":"-webkit-box-decoration-break","341":"-webkit-box-direction","342":"-webkit-box-flex","343":"-webkit-box-ordinal-group","344":"-webkit-box-orient","345":"-webkit-box-pack","346":"-webkit-box-reflect","347":"-webkit-font-smoothing","348":"-webkit-line-break","349":"-webkit-line-clamp","350":"-webkit-locale","351":"-webkit-mask-box-image","352":"-webkit-mask-box-image-outset","353":"-webkit-mask-box-image-repeat","354":"-webkit-mask-box-image-slice","355":"-webkit-mask-box-image-source","356":"-webkit-mask-box-image-width","357":"-webkit-print-color-adjust","358":"-webkit-rtl-ordering","359":"-webkit-tap-highlight-color","360":"-webkit-text-combine","361":"-webkit-text-decorations-in-effect","362":"-webkit-text-fill-color","363":"-webkit-text-orientation","364":"-webkit-text-security","365":"-webkit-text-stroke-color","366":"-webkit-text-stroke-width","367":"-webkit-user-drag","368":"-webkit-user-modify","369":"-webkit-writing-mode","accentColor":"auto","additiveSymbols":"","alignContent":"normal","alignItems":"normal","alignSelf":"auto","alignmentBaseline":"auto","all":"","animation":"none 0s ease 0s 1 normal none running","animationComposition":"replace","animationDelay":"0s","animationDirection":"normal","animationDuration":"0s","animationFillMode":"none","animationIterationCount":"1","animationName":"none","animationPlayState":"running","animationRange":"normal","animationRangeEnd":"normal","animationRangeStart":"normal","animationTimeline":"auto","animationTimingFunction":"ease","appRegion":"none","appearance":"none","ascentOverride":"","aspectRatio":"auto","backdropFilter":"none","backfaceVisibility":"visible","background":"rgba(0, 0, 0, 0) none repeat scroll 0% 0% / auto padding-box border-box","backgroundAttachment":"scroll","backgroundBlendMode":"normal","backgroundClip":"border-box","backgroundColor":"rgba(0, 0, 0, 0)","backgroundImage":"none","backgroundOrigin":"padding-box","backgroundPosition":"0% 0%","backgroundPositionX":"0%","backgroundPositionY":"0%","backgroundRepeat":"repeat","backgroundSize":"auto","basePalette":"","baselineShift":"0px","baselineSource":"auto","blockSize":"20.0938px","border":"0px none rgb(5, 5, 5)","borderBlock":"0px none rgb(5, 5, 5)","borderBlockColor":"rgb(5, 5, 5)","borderBlockEnd":"0px none rgb(5, 5, 5)","borderBlockEndColor":"rgb(5, 5, 5)","borderBlockEndStyle":"none","borderBlockEndWidth":"0px","borderBlockStart":"0px none rgb(5, 5, 5)","borderBlockStartColor":"rgb(5, 5, 5)","borderBlockStartStyle":"none","borderBlockStartWidth":"0px","borderBlockStyle":"none","borderBlockWidth":"0px","borderBottom":"0px none rgb(5, 5, 5)","borderBottomColor":"rgb(5, 5, 5)","borderBottomLeftRadius":"0px","borderBottomRightRadius":"0px","borderBottomStyle":"none","borderBottomWidth":"0px","borderCollapse":"separate","borderColor":"rgb(5, 5, 5)","borderEndEndRadius":"0px","borderEndStartRadius":"0px","borderImage":"none","borderImageOutset":"0","borderImageRepeat":"stretch","borderImageSlice":"100%","borderImageSource":"none","borderImageWidth":"1","borderInline":"0px none rgb(5, 5, 5)","borderInlineColor":"rgb(5, 5, 5)","borderInlineEnd":"0px none rgb(5, 5, 5)","borderInlineEndColor":"rgb(5, 5, 5)","borderInlineEndStyle":"none","borderInlineEndWidth":"0px","borderInlineStart":"0px none rgb(5, 5, 5)","borderInlineStartColor":"rgb(5, 5, 5)","borderInlineStartStyle":"none","borderInlineStartWidth":"0px","borderInlineStyle":"none","borderInlineWidth":"0px","borderLeft":"0px none rgb(5, 5, 5)","borderLeftColor":"rgb(5, 5, 5)","borderLeftStyle":"none","borderLeftWidth":"0px","borderRadius":"0px","borderRight":"0px none rgb(5, 5, 5)","borderRightColor":"rgb(5, 5, 5)","borderRightStyle":"none","borderRightWidth":"0px","borderSpacing":"0px 0px","borderStartEndRadius":"0px","borderStartStartRadius":"0px","borderStyle":"none","borderTop":"0px none rgb(5, 5, 5)","borderTopColor":"rgb(5, 5, 5)","borderTopLeftRadius":"0px","borderTopRightRadius":"0px","borderTopStyle":"none","borderTopWidth":"0px","borderWidth":"0px","bottom":"0px","boxShadow":"none","boxSizing":"content-box","breakAfter":"auto","breakBefore":"auto","breakInside":"auto","bufferedRendering":"auto","captionSide":"top","caretColor":"rgb(5, 5, 5)","clear":"none","clip":"auto","clipPath":"none","clipRule":"nonzero","color":"rgb(5, 5, 5)","colorInterpolation":"srgb","colorInterpolationFilters":"linearrgb","colorRendering":"auto","colorScheme":"normal","columnCount":"auto","columnFill":"balance","columnGap":"normal","columnRule":"0px none rgb(5, 5, 5)","columnRuleColor":"rgb(5, 5, 5)","columnRuleStyle":"none","columnRuleWidth":"0px","columnSpan":"none","columnWidth":"auto","columns":"auto auto","contain":"none","containIntrinsicBlockSize":"none","containIntrinsicHeight":"none","containIntrinsicInlineSize":"none","containIntrinsicSize":"none","containIntrinsicWidth":"none","container":"none","containerName":"none","containerType":"normal","content":"normal","contentVisibility":"visible","counterIncrement":"none","counterReset":"none","counterSet":"none","cursor":"text","cx":"0px","cy":"0px","d":"none","descentOverride":"","direction":"ltr","display":"block","dominantBaseline":"auto","emptyCells":"show","fallback":"","fieldSizing":"fixed","fill":"rgb(0, 0, 0)","fillOpacity":"1","fillRule":"nonzero","filter":"none","flex":"0 1 auto","flexBasis":"auto","flexDirection":"row","flexFlow":"row nowrap","flexGrow":"0","flexShrink":"1","flexWrap":"nowrap","float":"none","floodColor":"rgb(0, 0, 0)","floodOpacity":"1","font":"15px / 20.1px \\"Segoe UI Historic\\", \\"Segoe UI\\", Helvetica, Arial, sans-serif","fontDisplay":"","fontFamily":"\\"Segoe UI Historic\\", \\"Segoe UI\\", Helvetica, Arial, sans-serif","fontFeatureSettings":"normal","fontKerning":"auto","fontOpticalSizing":"auto","fontPalette":"normal","fontSize":"15px","fontStretch":"100%","fontStyle":"normal","fontSynthesis":"weight style small-caps","fontSynthesisSmallCaps":"auto","fontSynthesisStyle":"auto","fontSynthesisWeight":"auto","fontVariant":"normal","fontVariantAlternates":"normal","fontVariantCaps":"normal","fontVariantEastAsian":"normal","fontVariantLigatures":"normal","fontVariantNumeric":"normal","fontVariantPosition":"normal","fontVariationSettings":"normal","fontWeight":"400","forcedColorAdjust":"auto","gap":"normal","grid":"none / none / none / row / auto / auto","gridArea":"auto","gridAutoColumns":"auto","gridAutoFlow":"row","gridAutoRows":"auto","gridColumn":"auto","gridColumnEnd":"auto","gridColumnGap":"normal","gridColumnStart":"auto","gridGap":"normal normal","gridRow":"auto","gridRowEnd":"auto","gridRowGap":"normal","gridRowStart":"auto","gridTemplate":"none","gridTemplateAreas":"none","gridTemplateColumns":"none","gridTemplateRows":"none","height":"20.0938px","hyphenateCharacter":"auto","hyphenateLimitChars":"auto","hyphens":"manual","imageOrientation":"from-image","imageRendering":"auto","inherits":"","initialLetter":"normal","initialValue":"","inlineSize":"450px","inset":"0px","insetBlock":"0px","insetBlockEnd":"0px","insetBlockStart":"0px","insetInline":"0px","insetInlineEnd":"0px","insetInlineStart":"0px","isolation":"auto","justifyContent":"normal","justifyItems":"normal","justifySelf":"auto","left":"0px","letterSpacing":"normal","lightingColor":"rgb(255, 255, 255)","lineBreak":"after-white-space","lineGapOverride":"","lineHeight":"20.1px","listStyle":"outside none disc","listStyleImage":"none","listStylePosition":"outside","listStyleType":"disc","margin":"0px","marginBlock":"0px","marginBlockEnd":"0px","marginBlockStart":"0px","marginBottom":"0px","marginInline":"0px","marginInlineEnd":"0px","marginInlineStart":"0px","marginLeft":"0px","marginRight":"0px","marginTop":"0px","marker":"none","markerEnd":"none","markerMid":"none","markerStart":"none","mask":"none","maskClip":"border-box","maskComposite":"add","maskImage":"none","maskMode":"match-source","maskOrigin":"border-box","maskPosition":"0% 0%","maskRepeat":"repeat","maskSize":"auto","maskType":"luminance","mathDepth":"0","mathShift":"normal","mathStyle":"normal","maxBlockSize":"none","maxHeight":"none","maxInlineSize":"none","maxWidth":"none","minBlockSize":"0px","minHeight":"0px","minInlineSize":"0px","minWidth":"0px","mixBlendMode":"normal","negative":"","objectFit":"fill","objectPosition":"50% 50%","objectViewBox":"none","offset":"none 0px auto 0deg","offsetAnchor":"auto","offsetDistance":"0px","offsetPath":"none","offsetPosition":"normal","offsetRotate":"auto 0deg","opacity":"1","order":"0","orphans":"2","outline":"rgb(5, 5, 5) none 0px","outlineColor":"rgb(5, 5, 5)","outlineOffset":"0px","outlineStyle":"none","outlineWidth":"0px","overflow":"visible","overflowAnchor":"auto","overflowClipMargin":"0px","overflowWrap":"break-word","overflowX":"visible","overflowY":"visible","overlay":"none","overrideColors":"","overscrollBehavior":"auto","overscrollBehaviorBlock":"auto","overscrollBehaviorInline":"auto","overscrollBehaviorX":"auto","overscrollBehaviorY":"auto","pad":"","padding":"0px","paddingBlock":"0px","paddingBlockEnd":"0px","paddingBlockStart":"0px","paddingBottom":"0px","paddingInline":"0px","paddingInlineEnd":"0px","paddingInlineStart":"0px","paddingLeft":"0px","paddingRight":"0px","paddingTop":"0px","page":"auto","pageBreakAfter":"auto","pageBreakBefore":"auto","pageBreakInside":"auto","pageOrientation":"","paintOrder":"normal","perspective":"none","perspectiveOrigin":"225px 10.0469px","placeContent":"normal","placeItems":"normal","placeSelf":"auto","pointerEvents":"auto","position":"relative","prefix":"","quotes":"auto","r":"0px","range":"","resize":"none","right":"0px","rotate":"none","rowGap":"normal","rubyPosition":"over","rx":"auto","ry":"auto","scale":"none","scrollBehavior":"auto","scrollMargin":"0px","scrollMarginBlock":"0px","scrollMarginBlockEnd":"0px","scrollMarginBlockStart":"0px","scrollMarginBottom":"0px","scrollMarginInline":"0px","scrollMarginInlineEnd":"0px","scrollMarginInlineStart":"0px","scrollMarginLeft":"0px","scrollMarginRight":"0px","scrollMarginTop":"0px","scrollPadding":"auto","scrollPaddingBlock":"auto","scrollPaddingBlockEnd":"auto","scrollPaddingBlockStart":"auto","scrollPaddingBottom":"auto","scrollPaddingInline":"auto","scrollPaddingInlineEnd":"auto","scrollPaddingInlineStart":"auto","scrollPaddingLeft":"auto","scrollPaddingRight":"auto","scrollPaddingTop":"auto","scrollSnapAlign":"none","scrollSnapStop":"normal","scrollSnapType":"none","scrollTimeline":"none","scrollTimelineAxis":"block","scrollTimelineName":"none","scrollbarColor":"auto","scrollbarGutter":"auto","scrollbarWidth":"auto","shapeImageThreshold":"0","shapeMargin":"0px","shapeOutside":"none","shapeRendering":"auto","size":"","sizeAdjust":"","speak":"normal","speakAs":"","src":"","stopColor":"rgb(0, 0, 0)","stopOpacity":"1","stroke":"none","strokeDasharray":"none","strokeDashoffset":"0px","strokeLinecap":"butt","strokeLinejoin":"miter","strokeMiterlimit":"4","strokeOpacity":"1","strokeWidth":"1px","suffix":"","symbols":"","syntax":"","system":"","tabSize":"8","tableLayout":"auto","textAlign":"start","textAlignLast":"auto","textAnchor":"start","textCombineUpright":"none","textDecoration":"none solid rgb(5, 5, 5)","textDecorationColor":"rgb(5, 5, 5)","textDecorationLine":"none","textDecorationSkipInk":"auto","textDecorationStyle":"solid","textDecorationThickness":"auto","textEmphasis":"none rgb(5, 5, 5)","textEmphasisColor":"rgb(5, 5, 5)","textEmphasisPosition":"over","textEmphasisStyle":"none","textIndent":"0px","textOrientation":"mixed","textOverflow":"clip","textRendering":"auto","textShadow":"none","textSizeAdjust":"auto","textSpacingTrim":"normal","textTransform":"none","textUnderlineOffset":"auto","textUnderlinePosition":"auto","textWrap":"wrap","timelineScope":"none","top":"0px","touchAction":"auto","transform":"none","transformBox":"view-box","transformOrigin":"225px 10.0469px","transformStyle":"flat","transition":"all 0s ease 0s","transitionBehavior":"normal","transitionDelay":"0s","transitionDuration":"0s","transitionProperty":"all","transitionTimingFunction":"ease","translate":"none","unicodeBidi":"isolate","unicodeRange":"","userSelect":"text","vectorEffect":"none","verticalAlign":"baseline","viewTimeline":"none","viewTimelineAxis":"block","viewTimelineInset":"auto","viewTimelineName":"none","viewTransitionName":"none","visibility":"visible","webkitAlignContent":"normal","webkitAlignItems":"normal","webkitAlignSelf":"auto","webkitAnimation":"none 0s ease 0s 1 normal none running","webkitAnimationDelay":"0s","webkitAnimationDirection":"normal","webkitAnimationDuration":"0s","webkitAnimationFillMode":"none","webkitAnimationIterationCount":"1","webkitAnimationName":"none","webkitAnimationPlayState":"running","webkitAnimationTimingFunction":"ease","webkitAppRegion":"none","webkitAppearance":"none","webkitBackfaceVisibility":"visible","webkitBackgroundClip":"border-box","webkitBackgroundOrigin":"padding-box","webkitBackgroundSize":"auto","webkitBorderAfter":"0px none rgb(5, 5, 5)","webkitBorderAfterColor":"rgb(5, 5, 5)","webkitBorderAfterStyle":"none","webkitBorderAfterWidth":"0px","webkitBorderBefore":"0px none rgb(5, 5, 5)","webkitBorderBeforeColor":"rgb(5, 5, 5)","webkitBorderBeforeStyle":"none","webkitBorderBeforeWidth":"0px","webkitBorderBottomLeftRadius":"0px","webkitBorderBottomRightRadius":"0px","webkitBorderEnd":"0px none rgb(5, 5, 5)","webkitBorderEndColor":"rgb(5, 5, 5)","webkitBorderEndStyle":"none","webkitBorderEndWidth":"0px","webkitBorderHorizontalSpacing":"0px","webkitBorderImage":"none","webkitBorderRadius":"0px","webkitBorderStart":"0px none rgb(5, 5, 5)","webkitBorderStartColor":"rgb(5, 5, 5)","webkitBorderStartStyle":"none","webkitBorderStartWidth":"0px","webkitBorderTopLeftRadius":"0px","webkitBorderTopRightRadius":"0px","webkitBorderVerticalSpacing":"0px","webkitBoxAlign":"stretch","webkitBoxDecorationBreak":"slice","webkitBoxDirection":"normal","webkitBoxFlex":"0","webkitBoxOrdinalGroup":"1","webkitBoxOrient":"horizontal","webkitBoxPack":"start","webkitBoxReflect":"none","webkitBoxShadow":"none","webkitBoxSizing":"content-box","webkitClipPath":"none","webkitColumnBreakAfter":"auto","webkitColumnBreakBefore":"auto","webkitColumnBreakInside":"auto","webkitColumnCount":"auto","webkitColumnGap":"normal","webkitColumnRule":"0px none rgb(5, 5, 5)","webkitColumnRuleColor":"rgb(5, 5, 5)","webkitColumnRuleStyle":"none","webkitColumnRuleWidth":"0px","webkitColumnSpan":"none","webkitColumnWidth":"auto","webkitColumns":"auto auto","webkitFilter":"none","webkitFlex":"0 1 auto","webkitFlexBasis":"auto","webkitFlexDirection":"row","webkitFlexFlow":"row nowrap","webkitFlexGrow":"0","webkitFlexShrink":"1","webkitFlexWrap":"nowrap","webkitFontFeatureSettings":"normal","webkitFontSmoothing":"antialiased","webkitHyphenateCharacter":"auto","webkitJustifyContent":"normal","webkitLineBreak":"after-white-space","webkitLineClamp":"none","webkitLocale":"\\"en\\"","webkitLogicalHeight":"20.0938px","webkitLogicalWidth":"450px","webkitMarginAfter":"0px","webkitMarginBefore":"0px","webkitMarginEnd":"0px","webkitMarginStart":"0px","webkitMask":"none","webkitMaskBoxImage":"none","webkitMaskBoxImageOutset":"0","webkitMaskBoxImageRepeat":"stretch","webkitMaskBoxImageSlice":"0 fill","webkitMaskBoxImageSource":"none","webkitMaskBoxImageWidth":"auto","webkitMaskClip":"border-box","webkitMaskComposite":"add","webkitMaskImage":"none","webkitMaskOrigin":"border-box","webkitMaskPosition":"0% 0%","webkitMaskPositionX":"0%","webkitMaskPositionY":"0%","webkitMaskRepeat":"repeat","webkitMaskSize":"auto","webkitMaxLogicalHeight":"none","webkitMaxLogicalWidth":"none","webkitMinLogicalHeight":"0px","webkitMinLogicalWidth":"0px","webkitOpacity":"1","webkitOrder":"0","webkitPaddingAfter":"0px","webkitPaddingBefore":"0px","webkitPaddingEnd":"0px","webkitPaddingStart":"0px","webkitPerspective":"none","webkitPerspectiveOrigin":"225px 10.0469px","webkitPerspectiveOriginX":"","webkitPerspectiveOriginY":"","webkitPrintColorAdjust":"economy","webkitRtlOrdering":"logical","webkitRubyPosition":"before","webkitShapeImageThreshold":"0","webkitShapeMargin":"0px","webkitShapeOutside":"none","webkitTapHighlightColor":"rgba(0, 0, 0, 0.18)","webkitTextCombine":"none","webkitTextDecorationsInEffect":"none","webkitTextEmphasis":"none rgb(5, 5, 5)","webkitTextEmphasisColor":"rgb(5, 5, 5)","webkitTextEmphasisPosition":"over","webkitTextEmphasisStyle":"none","webkitTextFillColor":"rgb(5, 5, 5)","webkitTextOrientation":"vertical-right","webkitTextSecurity":"none","webkitTextSizeAdjust":"auto","webkitTextStroke":"","webkitTextStrokeColor":"rgb(5, 5, 5)","webkitTextStrokeWidth":"0px","webkitTransform":"none","webkitTransformOrigin":"225px 10.0469px","webkitTransformOriginX":"","webkitTransformOriginY":"","webkitTransformOriginZ":"","webkitTransformStyle":"flat","webkitTransition":"all 0s ease 0s","webkitTransitionDelay":"0s","webkitTransitionDuration":"0s","webkitTransitionProperty":"all","webkitTransitionTimingFunction":"ease","webkitUserDrag":"auto","webkitUserModify":"read-write","webkitUserSelect":"text","webkitWritingMode":"horizontal-tb","whiteSpace":"pre-wrap","whiteSpaceCollapse":"preserve","widows":"2","width":"450px","willChange":"auto","wordBreak":"break-word","wordSpacing":"0px","wordWrap":"break-word","writingMode":"horizontal-tb","x":"0px","y":"0px","zIndex":"auto","zoom":"1"}');

FreeCommentsWidget.defaultAvatarUrl = chrome.runtime.getURL('images/pushca48.ico');

FreeCommentsWidget.avatars = new Map();
FreeCommentsWidget.avatars.set('0', chrome.runtime.getURL('images/avatars/woman1.png'));
FreeCommentsWidget.avatars.set('1', chrome.runtime.getURL('images/avatars/woman2.png'));
FreeCommentsWidget.avatars.set('2', chrome.runtime.getURL('images/avatars/woman3.png'));
FreeCommentsWidget.avatars.set('3', chrome.runtime.getURL('images/avatars/woman4.png'));
FreeCommentsWidget.avatars.set('4', chrome.runtime.getURL('images/avatars/woman5.png'));
FreeCommentsWidget.avatars.set('5', chrome.runtime.getURL('images/avatars/woman6.png'));
FreeCommentsWidget.avatars.set('6', chrome.runtime.getURL('images/avatars/woman7.png'));
FreeCommentsWidget.avatars.set('7', chrome.runtime.getURL('images/avatars/woman8.png'));
FreeCommentsWidget.avatars.set('8', chrome.runtime.getURL('images/avatars/man1.png'));
FreeCommentsWidget.avatars.set('9', chrome.runtime.getURL('images/avatars/man2.png'));
FreeCommentsWidget.avatars.set('10', chrome.runtime.getURL('images/avatars/man3.png'));
FreeCommentsWidget.avatars.set('11', chrome.runtime.getURL('images/avatars/man4.png'));
FreeCommentsWidget.avatars.set('12', chrome.runtime.getURL('images/avatars/man5.png'));
FreeCommentsWidget.avatars.set('13', chrome.runtime.getURL('images/avatars/man6.png'));
FreeCommentsWidget.avatars.set('14', chrome.runtime.getURL('images/avatars/man7.png'));
FreeCommentsWidget.avatars.set('15', chrome.runtime.getURL('images/avatars/man8.png'));
FreeCommentsWidget.avatars.set('16', chrome.runtime.getURL('images/pushca48.ico'));

FreeCommentsWidget.loadPosts = function () {
    FreeCommentsWidget.posts.clear();
    PushcaClient.getChannels(PushcaClient.ClientObj.cloneWithoutDeviceId()).then(channelsResponse => {
        if (channelsResponse && isArrayNotEmpty(channelsResponse.channels)) {
            for (let i = 0; i < channelsResponse.channels.length; i++) {
                const channelWithInfo = channelsResponse.channels[i];
                FreeCommentsWidget.posts.set(channelWithInfo.channel.id, new PostInfo(
                    channelWithInfo.channel.id,
                    channelWithInfo.channel.name,
                    true,
                    null
                ))
            }
            //console.log(`Information about ${channelsResponse.channels.length} posts was added`);
        }
    });
}

FreeCommentsWidget.resetPosts = function () {
    FreeCommentsWidget.posts.clear();
}

FreeCommentsWidget.removeAllOpenWidgets = function () {
    document.querySelectorAll('div.widget-container').forEach(fcWidget => {
        const postId = extractPostIdFromWidgetSectionId(fcWidget, WidgetSection.CONTAINER);
        removeFreeCommentsWidget(postId);
    })
}

FreeCommentsWidget.reloadAllOpenWidgets = function () {
    document.querySelectorAll('div.widget-container').forEach(fcWidget => {
        const postId = extractPostIdFromWidgetSectionId(fcWidget, WidgetSection.CONTAINER);
        reloadAllComments(postId);
    })
}

const WidgetSection = Object.freeze({
    CONTAINER: "FC_CONTAINER",
    COMMENTS: "FC_COMMENTS",
    SEPARATOR: "FC_SEPARATOR",
    COMMENT_EDITOR: "FC_COMMENT_EDITOR",
    COMMENT_EDITOR_MEMO: "FC_COMMENT_EDITOR_MEMO",
    SEND_COMMENT_BUTTON: "FC_SEND_COMMENT_BUTTON"
});

class PostInfo {
    constructor(id, url, alreadySubscribed, onCommentAddedExternalHandler) {
        this.channel = new PChannel(id, url);
        this.alreadySubscribed = alreadySubscribed;
        this.onCommentAddedExternalHandler = onCommentAddedExternalHandler;
    }
}

const freedomUrl = chrome.runtime.getURL('images/freedom.png');
const vendettaUrl = chrome.runtime.getURL('images/vendetta.png');
const sendCommentGrayButtonUrl = chrome.runtime.getURL('images/send-file-gray-32.png');
const sendCommentBlueButtonUrl = chrome.runtime.getURL('images/send-file-blue-32.png');

function buildFcWidgetSectionId(postId, widgetSection) {
    return `${widgetSection}_${postId}`;
}

function extractPostIdFromWidgetSectionId(el0, widgetSection) {
    if (!el0 || isEmpty(el0.id)) {
        return null;
    }
    return el0.id.replace(`${widgetSection}_`, '');
}

function updateAccountIsActiveStateAndRefreshIndicators(accountId, isActive) {
    FreeCommentsWidget.fcAccounts.set(accountId, isActive);
    refreshAccountIsActiveIndicators(accountId);
}

function refreshAccountIsActiveIndicators(accountId) {
    let isAccountActive = false;
    if ('active' === FreeCommentsWidget.fcAccounts.get(accountId)) {
        isAccountActive = true;
    }
    document.querySelectorAll(
        `span[data-role='isActiveIndicator'][data-account-id='${accountId}']`
    ).forEach(indicator => {
        indicator.classList.remove("active-indicator");
        indicator.classList.remove("not-active-indicator");
        if (isAccountActive) {
            indicator.classList.add("active-indicator");
        } else {
            indicator.classList.add("not-active-indicator");
        }
    });
}

function getWidgetSectionElement(container, widgetSection) {
    if (WidgetSection.COMMENTS === widgetSection) {
        return container.querySelector('div.widget-comments');
    }
    if (WidgetSection.COMMENT_EDITOR === widgetSection) {
        return container.querySelector('div.widget-comment-editor');
    }
    if (WidgetSection.SEND_COMMENT_BUTTON === widgetSection) {
        return container.querySelector('div.widget-send-comment-button');
    }
    if (WidgetSection.COMMENT_EDITOR_MEMO === widgetSection) {
        return container.querySelector('div.widget-comment-editor-memo');
    }
}

function getFreeCommentsWidget(container, postId) {
    if (container) {
        return container.querySelector('div.widget-container');
    }
    if (!postId) {
        return null;
    }
    return document.getElementById(buildFcWidgetSectionId(postId, WidgetSection.CONTAINER));
}

function getPostId(el0) {
    const widgetContainer = findFirstParentWithClassName(el0, "widget-container");
    if (!widgetContainer) {
        return null;
    }
    return extractPostIdFromWidgetSectionId(
        widgetContainer, WidgetSection.CONTAINER
    );
}

function getWidgetSectionFromParents(el0, widgetSection) {
    const widgetContainer = findFirstParentWithClassName(el0, "widget-container");
    if (!widgetContainer) {
        return null;
    }
    return getWidgetSectionElement(widgetContainer, widgetSection);
}


function focusToWidget(container) {
    const editor = getWidgetSectionElement(container, WidgetSection.COMMENT_EDITOR_MEMO);
    if (editor) {
        scrollToElementMiddle(editor);
        const commentsSection = getWidgetSectionElement(container, WidgetSection.COMMENTS);
        if (commentsSection) {
            commentsSection.scrollTop = commentsSection.scrollHeight;
        }
        editor.focus();
    }
}

function removeFreeCommentsWidget(postId) {
    const widgetContainer = getFreeCommentsWidget(null, postId);
    if (!widgetContainer) {
        return null;
    }
    updateAndGetPostInfo(postId, null, null, null);
    const successor = findFirstParentWithEditableDiv(widgetContainer);
    widgetContainer.parentElement.dataset.freeCommentsWidgetId = '';
    widgetContainer.remove();
    if (successor) {
        const editableDiv = getEditableDiv(successor);
        if (editableDiv) {
            scrollToElementMiddle(editableDiv);
            editableDiv.focus();
        }
    }
    if (typeof FreeCommentsWidget.afterRemoveListener === 'function') {
        FreeCommentsWidget.afterRemoveListener();
    }
}

function loadComments(widgetContainer, postInfo, postId) {
    FreeCommentsWidget.postComments.set(widgetContainer, {commentIds: []});
    PushcaClient.getChannelHistory(postInfo.channel).then(historyPage => {
        if (historyPage) {
            getUserBlackList(function (blackList) {
                historyPage.messages.forEach(channelMessage => {
                    if (channelMessage.body
                        && (!channelMessage.body.startsWith("created at"))
                    ) {
                        addFreeCommentIntoWidgetWithBlockedCheck(postId, widgetContainer, channelMessage, blackList);
                    }
                });
            });
        }
    });
}

function createFreeCommentsWidget(anchorElement, postId, postUrl, sourceStyle,
                                  insertBeforeAnchorIfNoSiblings, onAddCommentExternalHandler) {
    if (!anchorElement) {
        return null;
    }

    if (anchorElement.parentElement.dataset.freeCommentsWidgetId) {
        return getFreeCommentsWidget(anchorElement.parentElement, null);
    }
    if (!postId) {
        console.error("Cannot create free comments widget: provided post id is empty");
        return null;
    }
    if (!postUrl) {
        console.error("Cannot create free comments widget: provided post url is empty");
        return null;
    }
    const widgetContainer = document.createElement('div');
    widgetContainer.id = buildFcWidgetSectionId(postId, WidgetSection.CONTAINER);
    widgetContainer.dataset.postId = postId;
    widgetContainer.dataset.postUrl = postUrl;
    widgetContainer.className = "widget-container";

    //comments
    const widgetComments = document.createElement('div');
    widgetComments.id = buildFcWidgetSectionId(postId, WidgetSection.COMMENTS);
    widgetComments.className = "widget-comments";
    widgetComments.style.backgroundImage = `url(${freedomUrl})`;
    widgetContainer.appendChild(widgetComments);

    //separator
    const widgetSeparator = createSeparator(postId);
    widgetContainer.appendChild(widgetSeparator);

    //comment editor
    const vSourceStyle = sourceStyle ? sourceStyle : FreeCommentsWidget.defaultSourceStyle;
    const widgetCommentEditor = createFreeCommentsEditor(
        postId,
        vSourceStyle
    );
    if (vSourceStyle) {
        widgetContainer.style.backgroundColor = vSourceStyle.backgroundColor;
    }
    widgetContainer.appendChild(widgetCommentEditor);

    setCustomDataAttributeForElementAndChildren(widgetContainer, "alreadyDiscovered", 'true');
    updateAndGetPostInfo(postId, postUrl, null, onAddCommentExternalHandler).then(postInfo => {
        loadComments(widgetContainer, postInfo, postId);
    });

    insertElementBeforeNextSibling(anchorElement, widgetContainer, insertBeforeAnchorIfNoSiblings);
    anchorElement.parentElement.dataset.freeCommentsWidgetId = widgetContainer.id;
    return widgetContainer;
}

async function loadAndUpdatePostInfo(postId, postUrl, alreadySubscribed, onCommentAddedExternalHandler) {
    const channelsResponse = await PushcaClient.getChannelsPublicInfo([postId]);
    if (channelsResponse && isArrayNotEmpty(channelsResponse.channels)) {
        FreeCommentsWidget.posts.set(
            postId,
            new PostInfo(
                postId,
                channelsResponse.channels[0].channel.name,
                alreadySubscribed,
                onCommentAddedExternalHandler
            )
        );
        if (alreadySubscribed) {
            updatePostPreviewTotal(postId, channelsResponse.channels[0].counter);
        }
        return;
    }
    if (postUrl) {
        FreeCommentsWidget.posts.set(
            postId,
            new PostInfo(
                postId,
                postUrl,
                alreadySubscribed,
                onCommentAddedExternalHandler
            )
        );
    }
}

async function updateAndGetPostInfo(postId, postUrl, alreadySubscribed, onCommentAddedExternalHandler) {
    const postInfo = FreeCommentsWidget.posts.get(postId);
    let externalHandler = onCommentAddedExternalHandler;
    if ((!externalHandler) && postInfo) {
        externalHandler = postInfo.onCommentAddedExternalHandler;
    }
    let subscribed = alreadySubscribed;
    if (subscribed === null) {
        subscribed = postInfo ? postInfo.alreadySubscribed : false;
    }
    await loadAndUpdatePostInfo(postId, postUrl, subscribed, externalHandler);
    return FreeCommentsWidget.posts.get(postId);
}

function reloadAllComments(postId) {
    const widgetContainer = getFreeCommentsWidget(null, postId);
    if (!widgetContainer) {
        //console.log(`No widget container for post with id ${postId}`);
        return;
    }
    const postInfo = FreeCommentsWidget.posts.get(postId);
    if (!postInfo) {
        return;
    }
    const comments = getWidgetSectionElement(widgetContainer, WidgetSection.COMMENTS);
    if (!comments) {
        console.error(`No comments section in widget container for post with id ${postId}`);
        return;
    }
    removeAllChildren(comments);
    loadComments(widgetContainer, postInfo, postId);
}

function showAsPanel(widgetContainer) {
    widgetContainer.style.paddingTop = '20px';
    const commentsSection = getWidgetSectionElement(widgetContainer, WidgetSection.COMMENTS);
    if (commentsSection) {
        commentsSection.style.minHeight = `450px`;
    }
}

function createSeparator(postId) {
    const widgetSeparator = document.createElement('div');
    widgetSeparator.id = buildFcWidgetSectionId(postId, WidgetSection.SEPARATOR);
    widgetSeparator.className = "widget-separator";

    let isResizing = false;
    widgetSeparator.addEventListener('mousedown', function (event) {
        const resizingTargetObj = event.target.previousSibling;
        if (!resizingTargetObj) {
            return;
        }
        isResizing = true;
        let startY = event.clientY;
        let startHeight = resizingTargetObj.getBoundingClientRect().height;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        function onMouseMove(e) {
            if (!isResizing) {
                return;
            }
            document.body.classList.add('no-select');
            const dy = e.clientY - startY;
            resizingTargetObj.style.height = `${(startHeight + dy)}px`;
        }

        function onMouseUp() {
            isResizing = false;
            document.body.classList.remove('no-select');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    });

    return widgetSeparator;
}

function createFreeCommentsEditor(postId, sourceStyle) {
    const container = document.createElement('div');
    container.id = buildFcWidgetSectionId(postId, WidgetSection.COMMENT_EDITOR);
    container.className = "widget-comment-editor";

    const commentEditorMemo = document.createElement('div');
    commentEditorMemo.id = buildFcWidgetSectionId(postId, WidgetSection.COMMENT_EDITOR_MEMO);
    commentEditorMemo.setAttribute('aria-label', 'Write a free comment…');
    commentEditorMemo.setAttribute('contenteditable', 'true');
    commentEditorMemo.setAttribute('spellcheck', 'true');
    commentEditorMemo.setAttribute('data-lexical-editor', 'true');
    commentEditorMemo.setAttribute('role', 'textbox');
    commentEditorMemo.className = 'widget-comment-editor-memo';
    if (sourceStyle) {
        copyFont(null, commentEditorMemo, sourceStyle);
    }
    addCommentEditorMemoListeners(commentEditorMemo);
    commentEditorMemo.style.backgroundColor = 'transparent';
    commentEditorMemo.style.border = 'none';
    container.appendChild(commentEditorMemo);

    //buttons
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = "widget-buttons-container";

    const commentDest = document.createElement('div');
    commentDest.className = "widget-button";
    commentDest.innerHTML = `
            <div class="widget-button-image">
                    <img src="${vendettaUrl}" alt="Vendetta" />
            </div>
        `;
    buttonsDiv.appendChild(commentDest);

    const sendButton = document.createElement('div');
    sendButton.id = buildFcWidgetSectionId(postId, WidgetSection.SEND_COMMENT_BUTTON);
    sendButton.className = "widget-button widget-send-comment-button disabled";
    sendButton.innerHTML = `
            <div class="widget-button-image">
                    <img src="${sendCommentGrayButtonUrl}" alt="Post comment" />
            </div>
        `;
    sendButton.removeEventListener('click', sendCommentHandler);
    sendButton.addEventListener('click', sendCommentHandler);
    buttonsDiv.appendChild(sendButton);

    container.appendChild(buttonsDiv);
    return container;
}

function sendCommentHandler(event) {
    const widgetContainer = findFirstParentWithClassName(event.target, "widget-container");
    if (!widgetContainer) {
        return;
    }
    const postId = extractPostIdFromWidgetSectionId(
        widgetContainer, WidgetSection.CONTAINER
    );
    const editor = getWidgetSectionElement(widgetContainer, WidgetSection.COMMENT_EDITOR_MEMO);
    if (!editor) {
        return;
    }
    const commentText = editor.textContent.trim();
    if (isEmpty(commentText)) {
        return;
    }
    const postInfo = FreeCommentsWidget.posts.get(postId);
    if (!postInfo) {
        return;
    }
    //console.log(`Send comment into channel ${JSON.stringify(postInfo.channel)}: ${commentText}, client: ${JSON.stringify(PushcaClient.ClientObj)}`);
    sendCommentToChannel(postInfo, commentText).then(messageDetails => {
        const channelMessage = new ChannelMessage(
            PushcaClient.ClientObj, postId, messageDetails.id, null, null,
            commentText, []);
        addFreeCommentIntoAllWidgets(postId, channelMessage);
        refreshAllHints(postId, true);
    });

    editor.textContent = "";
    changeWidgetSendButtonAvailability(event.target, false);

    event.stopPropagation();
    event.preventDefault();
}

async function addMeToChannel(postId, postUrl) {
    const postInfo = FreeCommentsWidget.posts.get(postId);
    if (postInfo && postInfo.alreadySubscribed) {
        return true;
    }
    await updateAndGetPostInfo(postId, postUrl, true, null);
    const channel = FreeCommentsWidget.posts.get(postId).channel;
    const result = await PushcaClient.addMembersToChannel(
        channel,
        [PushcaClient.ClientObj.cloneWithoutDeviceId()]
    );
    if (result) {
        //console.log(`Client ${PushcaClient.ClientObj.accountId} was added into channel ${JSON.stringify(channel)}`);
    }
    return result;
}

async function sendCommentToChannel(postInfo, commentText) {
    if (!postInfo.alreadySubscribed) {
        await addMeToChannel(postInfo.channel.id, postInfo.channel.name);
    }
    return PushcaClient.sendMessageToChannel(postInfo.channel, [], commentText);
}

function addCommentEditorMemoListeners(commentEditorMemo) {
    commentEditorMemo.addEventListener('focus', function () {
        if (this.textContent === '') {
            this.innerHTML = '';
        }
    });

    commentEditorMemo.addEventListener('blur', function () {
        if (!this.textContent.trim()) {
            this.innerHTML = ''; // Ensure the div is empty and the CSS ::before content shows
        }
    });

    commentEditorMemo.addEventListener('keydown', function (event) {
        if (event.keyCode === 13 || event.key === "Enter") {
            event.stopPropagation();
            event.preventDefault();
        }
        if (event.keyCode === 27 || event.key === "Escape") {
            event.stopPropagation();
            event.preventDefault();
        }
    });

    commentEditorMemo.addEventListener('keyup', function (event) {
        const sendButton = getWidgetSectionFromParents(event.target, WidgetSection.SEND_COMMENT_BUTTON);
        if (event.keyCode === 13 || event.key === "Enter") {
            event.stopPropagation();
            event.preventDefault();
            if (sendButton) {
                sendButton.dispatchEvent(createMouseClickEvent(0, 0, false));
            }
            return;
        }
        if (event.keyCode === 27 || event.key === "Escape") {
            event.stopPropagation();
            event.preventDefault();
            const postId = getPostId(event.target);
            if (postId) {
                removeFreeCommentsWidget(postId);
            }
        }
        if (!commentEditorMemo.textContent.trim()) {
            changeWidgetSendButtonAvailability(sendButton, false);
        } else {
            changeWidgetSendButtonAvailability(sendButton, true);
        }
    });
}

function changeWidgetSendButtonAvailability(sendButton, enableIt) {
    if (!sendButton) {
        return;
    }
    let newImageUrl;
    if (enableIt && sendButton.classList.contains('disabled')) {
        sendButton.classList.replace("disabled", "enabled");
        newImageUrl = sendCommentBlueButtonUrl;
    }
    if ((!enableIt) && sendButton.classList.contains('enabled')) {
        sendButton.classList.replace("enabled", "disabled");
        newImageUrl = sendCommentGrayButtonUrl;
    }
    if (!newImageUrl) {
        return;
    }
    sendButton.innerHTML = `
            <div class="widget-button-image">
                    <img src="${newImageUrl}" alt="Post comment" />
            </div>
        `;
}

//================================comments====================================
function addFreeCommentIntoAllWidgets(postId, channelMessage) {
    getUserBlackList(function (blackList) {
        document.querySelectorAll('div.widget-container').forEach(widgetContainer => {
            const vPostId = extractPostIdFromWidgetSectionId(
                widgetContainer, WidgetSection.CONTAINER
            );
            if (vPostId && (vPostId === postId)) {
                addFreeCommentIntoWidgetWithBlockedCheck(postId, widgetContainer, channelMessage, blackList);
            }
        });
    });
}

function extractSenderDetailsFromDeviceId(channelMessage) {
    let senderDetails;
    try {
        const deviceId = JSON.parse(channelMessage.sender.deviceId);
        const signatureHash = deviceId['signatureHash'];
        const webSite = deviceId['webSite'];
        senderDetails = {
            avatarUrl: FreeCommentsWidget.avatars.get(deviceId['avatarCode']),
            signatureHash: signatureHash,
            webSite: webSite,
            signatureHashVerbal: convertHashToReadableSignature(signatureHash)
        }
    } catch (error) {
        senderDetails = {
            avatarUrl: FreeCommentsWidget.defaultAvatarUrl,
            signatureHash: "",
            webSite: "",
            signatureHashVerbal: ""
        }
    }
    return senderDetails;
}

function addFreeCommentIntoWidgetWithBlockedCheck(postId, fcWidgetContainer, channelMessage, blackList) {
    if (blackList) {
        if ((!blackList.includes(extractSenderDetailsFromDeviceId(channelMessage)["signatureHash"]))) {
            addFreeCommentIntoWidget(postId, fcWidgetContainer, channelMessage);
        }
        return;
    }
    getUserBlackList(function (userBlackList) {
        addFreeCommentIntoWidgetWithBlockedCheck(postId, fcWidgetContainer, channelMessage, userBlackList);
    });
}

function addFreeCommentIntoWidget(postId, fcWidgetContainer, channelMessage) {
    const commentId = channelMessage.messageId;
    if (!commentId) {
        console.log(`Cannot add comment into container: post id = ${postId}, reason - empty message id`);
        return;
    }
    const widgetContainer = (fcWidgetContainer) ? fcWidgetContainer : getFreeCommentsWidget(null, postId);
    if (!widgetContainer) {
        return;
    }
    const metaData = FreeCommentsWidget.postComments.get(widgetContainer);
    if (!metaData) {
        console.log(`Container is in invalid state: post id = ${postId}, reason - metadata is absent`);
        return;
    }
    if (isArrayNotEmpty(metaData.commentIds)) {
        if (metaData.commentIds.includes(commentId)) {
            return;
        }
    }
    const vAccountId = channelMessage.sender.accountId;
    let isAccountActive = false;
    if ('active' === FreeCommentsWidget.fcAccounts.get(vAccountId)) {
        isAccountActive = true;
    }
    const aClassName = isAccountActive ? "active-indicator" : "not-active-indicator";

    const senderDetails = extractSenderDetailsFromDeviceId(channelMessage);
    const avatarUrl = senderDetails["avatarUrl"];
    const signatureHash = senderDetails["signatureHash"];
    const signatureHashVerbal = senderDetails["signatureHashVerbal"];
    const webSite = senderDetails["webSite"];
    metaData.commentIds.push(commentId);
    const widgetComments = getWidgetSectionElement(widgetContainer, WidgetSection.COMMENTS);
    const commentElement = document.createElement('div');
    commentElement.role = 'article';
    commentElement.dataset.messageId = channelMessage.messageId;
    commentElement.style.width = '90%';
    commentElement.innerHTML = `
            <div class="comment">
                <div class="comment-avatar">
                    <img src="${avatarUrl}" style="cursor: ${(webSite) ? 'pointer' : 'default'}" alt="Avatar" data-web-site="${webSite}" title=" ${(webSite) ? webSite + ' | ' + signatureHashVerbal : signatureHashVerbal}"/>
                </div>
                <div class="comment-content">
                    <div class="comment-author">
                        ${channelMessage.sender.accountId}
                        <span data-account-id="${vAccountId}" data-role="isActiveIndicator" class="${aClassName}"></span>
                    </div>
                    <div class="comment-text">${channelMessage.body}</div>
                    <div class="comment-date">${printDateTime(channelMessage.sendTime)}</div>
                </div>
            </div>
        `;
    commentElement.addEventListener('contextmenu', function (event) {
        event.preventDefault();
        event.stopPropagation();
        showContextMenu(event.pageX, event.pageY, vAccountId, signatureHash);
    });
    widgetComments.appendChild(commentElement);
    widgetComments.scrollTop = widgetComments.scrollHeight;
    const postInfo = FreeCommentsWidget.posts.get(postId);
    if (postInfo && postInfo.onCommentAddedExternalHandler) {
        postInfo.onCommentAddedExternalHandler(channelMessage);
    }
}

//============================================================================

//NOTE:================Context menu================================================================
document.addEventListener('click', function (event) {
    if (event.target.alt === "Avatar" && event.target.dataset.webSite) {
        const url = event.target.dataset.webSite;
        if ('undefined' !== url) {
            window.open(url, '_blank');
        }
    }
    let menu = document.getElementById('freeCommentsContextMenu');
    if (menu) {
        menu.style.display = 'none';
    }
}, true);

function showContextMenu(x, y, accountId, signatureHash) {
    let menu = document.getElementById('freeCommentsContextMenu');
    if (!menu) {
        menu = createContextMenu();
    }
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.display = 'block';

    const blockAllFromUserMenuItem = document.getElementById("block-all-from-that-user");
    if (blockAllFromUserMenuItem) {
        blockAllFromUserMenuItem.dataset.accountId = accountId;
        blockAllFromUserMenuItem.dataset.signatureHash = signatureHash;
    }
}

function createContextMenu() {
    const menu = document.createElement('ul');
    menu.id = 'freeCommentsContextMenu';
    menu.innerHTML = `
        <li id="block-all-from-that-user">Block all from that user</li>
    `;
    document.body.appendChild(menu);
    const blockAllFromUserMenuItem = document.getElementById("block-all-from-that-user");
    if (blockAllFromUserMenuItem) {
        blockAllFromUserMenuItem.addEventListener('click', blockAllFromUser);
    }
    return menu;
}

function blockAllFromUser(event) {
    if (!event.target.dataset) {
        return;
    }
    const accountId = event.target.dataset.accountId;
    const signatureHash = event.target.dataset.signatureHash;
    if (!accountId) {
        return;
    }
    console.log(`Block all from ${accountId}: signature hash = ${signatureHash}`);
    addUserToBlackList(accountId, signatureHash);
}

//=================================================================================================