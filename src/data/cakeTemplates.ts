import type { StudioDesign, OrnamentKind } from '../types/studio';
// Visually audited photograph features, independent of product photographs and approved pricing.
export const TEMPLATE_FEATURES: Record<string, { colours: string[]; height?: number; shape?: StudioDesign['shape']; finish?: StudioDesign['finish']; decorations: OrnamentKind[]; reference: string }> = {
 '0006': {colours:['#fff4df'], decorations:['Rose cluster','Ribbon','Topper'], reference:'Single long-stem rose, distressed red band, twine and handwritten topper'},
 '0007': {colours:['#edb9d3'], finish:'Watercolour', decorations:['Gold leaf','Topper'], reference:'Torn white upper edge, wrapped chocolates and script topper'},
 '0008': {colours:['#fff7e8'], height:1.2, finish:'Marble', decorations:['Rose cluster','Leaves'], reference:'Emerald crystal geode opening, individual leaf veining and fine filler flowers'},
 '0009': {colours:['#ed87a5'], finish:'Quilted fondant', decorations:['Pearls','Bow','Plaque'], reference:'Cosmetics replicas, branded labels and scalloped plaque'},
 '0010': {colours:['#f97314'], finish:'Horizontal grooves', decorations:['Blossoms','Pearls'], reference:'Orange-to-white piped buttercream rosettes and handwritten icing'},
 '0012': {colours:['#fff5df'], decorations:['Blossoms','Topper','Print reference'], reference:'Peppa Pig book-cover print and gold sphere arrangement'},
 '0013': {colours:['#74cde7'], decorations:['Blossoms','Leaves','Topper','Print reference'], reference:'Rainbow, house, clouds, balloons and character cutouts'},
 '0014': {colours:['#fff9ed'], height:1.1, decorations:['Gold leaf','Geometric ornament'], reference:'Sculptural gold sail and torn black sugar sheet; WA0020 is an alternate view'},
 '0016': {colours:['#673e24','#fff8ec'], shape:'Rectangular', decorations:['Blossoms','Plaque','Topper'], reference:'Stacked book-shaped base, round upper cake, mortarboard and graduation silhouette'},
 '0017': {colours:['#ffffff','#ffffff'], decorations:['Drip','Topper','Blossoms'], reference:'Black ganache drips, 18 topper and wrapped chocolates; source is a phone screenshot'},
 '0018': {colours:['#eee5d6'], shape:'Square', decorations:['Leaves','Topper'], reference:'Fresh berries, chocolate bars and piped gold script'},
 '0019': {colours:['#fff6ed'], decorations:['Pearls','Print reference','Topper'], reference:'Hello Kitty and friends cutouts, butterflies and pink confetti'},
 '0021': {colours:['#fff9ef'], height:1.3, decorations:['Ribbon','Bow','Rose cluster'], reference:'Shirt collar, buttons, pocket and green braces'},
 '0022': {colours:['#fff8ed'], finish:'Marble', decorations:['Plaque','Topper','Gold leaf'], reference:'Black marble lower wrap, multiple individual text plaques and gold spheres'},
 '0024': {colours:['#fff5df'], finish:'Horizontal grooves', decorations:['Beaded border','Bow','Plaque'], reference:'Piped vintage scallops and illustrated top print'},
 '0025': {colours:['#fff9ed'], finish:'Watercolour', decorations:['Rose cluster','Topper','Gold leaf'], reference:'Painted pink florals, script topper and thin custom name plaque'},
 '0026': {colours:['#fff5df'], decorations:['Leaves','Blossoms','Topper'], reference:'Sculpted lion, giraffe, animal-print lettering and jungle foliage'},
 '0027': {colours:['#fff5df'], finish:'Watercolour', decorations:['Rose cluster','Blossoms','Gold leaf'], reference:'Carnations, macarons, eucalyptus/filler flowers and teal palette-knife band'},
 '0028': {colours:['#fff6e8'], finish:'Watercolour', decorations:['Rose cluster','Leaves'], reference:'Pressed flower fragments, macarons and natural floral colour variation'},
 '0029': {colours:['#fff9ed'], decorations:['Bow','Plaque','Topper'], reference:'Large crown, seated teddy, pinwheel and heart ornaments'},
 '0030': {colours:['#c5dff0'], decorations:['Pearls','Topper'], reference:'Textured teddy carrying parcels, polka dots and painted word one'},
 '0031': {colours:['#fff9ed'], decorations:['Bow','Plaque','Rose cluster','Beaded border'], reference:'Pink crown with 25 number, initials wreath and board script'},
 '0032': {colours:['#b48654'], finish:'Metallic accents', decorations:['Rose cluster','Gold leaf','Beaded border','Topper'], reference:'Chocolate-bar side panels and specific date topper'},
 '0033': {colours:['#c7d9b5'], decorations:['Rose cluster','Bow','Plaque','Beaded border'], reference:'Baby figurine and detailed individual blossoms'},
 '0034': {colours:['#fff9ed'], finish:'Watercolour', decorations:['Gold leaf','Geometric ornament','Topper'], reference:'Black folded fans, open gold fan ornaments and varied metallic spheres'},
 '0035': {colours:['#f4eddc','#f4eddc','#f4eddc'], finish:'Rustic frosting', decorations:['Rose cluster','Ribbon','Leaves'], reference:'Large cream chrysanthemum-style flowers, cascading diagonal arrangements'},
 '0036': {colours:['#fff8ed'], height:1.1, finish:'Watercolour', decorations:['Gold leaf','Plaque','Pearls'], reference:'Blue/gold abstract painted strokes, square script frame and gold/blue spheres'},
 '0037': {colours:['#f4b8ca','#f4b8ca'], decorations:['Blossoms','Topper'], reference:'Castle geometry, towers, glitter roofs, door, stone path and crown'},
 '0038': {colours:['#f5c8d3'], height:1.1, decorations:['Pearls','Topper','Print reference'], reference:'Butterflies, teddy figurine and gold/pink decorative spheres'},
 '0039': {colours:['#d74567','#fff5da'], shape:'Square', decorations:['Ribbon','Plaque','Topper'], reference:'Sculpted cupcake upper tier, striped gift box and candle'},
 '0040': {colours:['#a69de1'], height:1.2, finish:'Ombré', decorations:['Pearls','Blossoms','Topper'], reference:'Blue-violet sculptural sails, silver/blue spheres and individual piped shells'},
 '0041': {colours:['#234c91','#c52b29','#fff5df'], shape:'Square', decorations:['Ribbon','Topper','Print reference'], reference:'Toy Story cowboy hat, cow spots, belt rope, stars and boot appliqués'},
 '0042': {colours:['#f4d4d0','#f4d4d0','#f4d4d0','#f4d4d0'], finish:'Horizontal grooves', decorations:['Rose cluster','Leaves','Beaded border'], reference:'Dense cascading roses, petals and mixed natural flower scales'},
 '0043': {colours:['#202020','#d7ae51','#202020'], finish:'Quilted fondant', decorations:['Ribbon','Bow','Plaque','Topper'], reference:'Large gold loop bow, vertical gift stripes and mixed finish tiers'},
 '0044': {colours:['#fff9ef'], decorations:['Pearls','Topper'], reference:'Jewelled silver crown, long silver candles and fine script lettering'},
 '0045': {colours:['#f9de86'], finish:'Vertical ridges', decorations:['Rose cluster','Blossoms','Bow'], reference:'Bouquet cupcake silhouette and densely piped peach/yellow rosettes'},
 '0046': {colours:['#f4aac4'], decorations:['Blossoms','Pearls','Bow','Topper','Print reference'], reference:'Hello Kitty figurine, rainbow, butterflies and multicoloured textured name letters'},
 '0047': {colours:['#fff8ed','#fff8ed'], decorations:['Ribbon','Bow','Plaque'], reference:'Tuxedo buttons and black braces; striped lower tier'},
 '0048': {colours:['#fff7ed'], height:1.1, decorations:['Pearls','Topper','Print reference'], reference:'Butterfly decorations and gold script name; pink/gold spheres'},
 '0049': {colours:['#e79aad'], finish:'Horizontal grooves', decorations:['Pearls','Print reference','Topper'], reference:'Fine lace butterflies, piped scallops and board name'},
 '0050': {colours:['#fff4dd','#fff4dd','#fff4dd'], decorations:['Ribbon','Plaque','Pearls'], reference:'Handbag fourth shape, handles, branded pattern, shoe, watch, chain and draped pearls'},
 '0051': {colours:['#c8d8ad'], height:1.1, finish:'Rustic frosting', decorations:['Rose cluster','Leaves','Geometric ornament'], reference:'Pampas grass, chrysanthemum flowers, thin gold hoop and metallic spheres'},
 '0052': {colours:['#fff9ed'], height:1.1, finish:'Watercolour', decorations:['Gold leaf','Topper'], reference:'Blue/gold painted strokes, macarons, blackberries and mirrored 47 topper'}
};
export function catalogueTemplate(id: string): StudioDesign | undefined {
 const key = id.slice(-4), feature = TEMPLATE_FEATURES[key];
 if (!feature) return undefined;
 const count = feature.colours.length;
 const baseWidth = count===1 ? (feature.height && feature.height>=1.3 ? 1.3 : feature.height ? 1.6 : 2) : 2.8;
 const tierHeight = ['0035','0042'].includes(key) ? 1.1 : feature.height ? Math.min(1.6,feature.height*1.25) : count===1 ? 1.2 : 1;
 const decorations=feature.decorations.flatMap((kind,i)=>Array.from({length:kind==='Rose cluster'&&['0035','0042'].includes(key)?count:1},(_,j)=>({id:`template-${i}-${j}`,kind,tier:['Topper','Blossoms','Leaves'].includes(kind)||(kind==='Rose cluster'&&!['0035','0042'].includes(key)) ? count-1 : j,region: (kind==='Rose cluster'&&['0035','0042'].includes(key)?'Front':['Rose cluster','Blossoms','Leaves','Topper'].includes(kind) ? 'Top' : 'Front') as 'Top'|'Front',scale:.8,rotation:0,colour:kind==='Leaves'?'#597c56':kind==='Drip'?'#202020':kind==='Rose cluster'?({'0006':'#a71b36','0008':'#24704d','0032':'#d16d36','0035':'#fff3dd','0051':'#fff3dd'}[key] || '#e3a4b1'):kind==='Bow'&&key==='0021'?'#416732':kind==='Bow'&&key==='0024'?'#202020':['Gold leaf','Geometric ornament','Topper'].includes(kind) ? '#c6a044' : '#fff2df',density:kind==='Rose cluster' ? (key==='0006'?1:3) : 1,text:''})));
 return {version:1, templateId:id, shape:feature.shape || 'Round', tiers:feature.colours.map((colour,i)=>({width: Math.max(1, baseWidth-i*.5), depth:Math.max(1,baseWidth-i*.5), height:tierHeight, taper:0, offset:0, colour})), finish:feature.finish || 'Smooth buttercream', secondaryColour: ({'0008':'#24704d','0022':'#676b74','0025':'#f2baca','0028':'#e7c2d3','0034':'#202020'}[key] || (['0040','0036','0052','0027'].includes(key) ? '#239ab2' : '#ffffff')), board:{visible:true,colour:'#fff9ef',finish:'Matte'}, decorations,personalisation:{name:'',number:'',message:'',event:'',scheme:''},referenceOnly:[feature.reference, ...(count===4 ? ['Four-tier construction requires bakery confirmation'] : [])]};
}
