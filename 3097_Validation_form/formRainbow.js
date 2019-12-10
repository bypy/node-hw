const rainbowFields = [
    {name:'firstName', type:'text', optn:false, ph:"Ваше имя"},
    {name:'lastName', type:'text', optn:false, ph:'Ваша фамилия'},
    {name:'fatherName', type:'text', optn:true, ph:'Ваше отчество'},
    {name:'age', type:'text', optn:false, ph:'Ваш возраст'},
    {name:'color1', type:'text', optn:false, ph:"цвет 1", bg:"red"},
    {name:'color2', type:'text', optn:false, ph:'цвет 2', bg:"orange"},
    {name:'color3', type:'text', optn:false, ph:'цвет 3', bg:"yellow"},
    {name:'color4', type:'text', optn:false, ph:'цвет 4', bg:"green"},
    {name:'color5', type:'text', optn:false, ph:'цвет 5', bg:"cyan"},
    {name:'color6', type:'text', optn:false, ph:'цвет 6', bg:"blue"},
    {name:'color7', type:'text', optn:false, ph:'цвет 7', bg:"purple"},
    {name:'dummy1', type:'text', optn:true},
    {name:'dummy2', type:'text', optn:true, ph:'тоже необязательное'},
];

const rainbowAnswers = {
    'color1':'красный',
    'color2':'оранжевый',
    'color3':'желтый',
    'color4':'зеленый',
    'color5':'голубой',
    'color6':'синий',
    'color7':'фиолетовый',
};

exports.rainbowFields = rainbowFields;
exports.rainbowAnswers = rainbowAnswers;